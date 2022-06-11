import { Platform, FetchedPastcastQuestion } from "..";
import { sleep } from "../../utils/sleep";
import {
  ApiCommon,
  ApiMultipleQuestions,
  ApiPredictable,
  ApiQuestion,
  fetchApiQuestions,
  fetchSingleApiQuestion,
} from "./api";
import seedrandom from "seedrandom";

const platformName = "metaculus";
const now = new Date();
const SLEEP_TIME = 1000;

async function apiQuestionToFetchedQuestions(
  apiQuestion: ApiQuestion
): Promise<FetchedPastcastQuestion[]> {
  // one item can expand:
  // - to 0 questions if we don't want it;
  // - to 1 question if it's a simple forecast
  // - to multiple questions if it's a group (see https://github.com/quantified-uncertainty/metaforecast/pull/84 for details)

  const skip = (q: ApiPredictable): boolean => {
    // only include resolved questions, non-ambiguous
    if (q.resolution === null || q.resolution == -1) {
      return true;
    }

    // only fetch binary for now
    if (q.possibilities.type !== "binary") {
      return true;
    }

    if (q.community_prediction.history.length === 0) {
      return true;
    }

    // try to exclude questions for which the fact that they've resolved
    // gives away info

    // exclude date questions for which the info it has resolved
    // cuts off some of the possible range
    if (q.possibilities.scale && q.possibilities.scale.format === "date") {
      if (new Date(q.possibilities.scale.max) > now) {
        return true;
      }
    }

    // exclude questions that are supposed to have still been open
    // note that unfortunately we can't exclude questions that
    // are supposed to have been closed but not resolved, as 
    // the Metaculus API doesn't retain the original resolve time
    // when a question is resolved early.
    if (new Date(q.close_time) > now) {
      return true;
    }

    return false;
  };

  const buildFetchedQuestion = (
    q: ApiPredictable & ApiCommon
  ): Omit<FetchedPastcastQuestion, "url" | "description" | "title"> => {
    const isBinary = q.possibilities.type === "binary";
    if (!isBinary) {
      throw Error("only should be fetching binary qs rn?");
    }

    const startDate = new Date(q.publish_time);
    const closeDate = new Date(q.close_time);

    var rng = seedrandom(`${platformName}-${q.id}`);
    const vantageDate = new Date(startDate.getTime() + rng() * (closeDate.getTime() - startDate.getTime()));

    const possibleAggregateEl = q.community_prediction.history.reverse().find((el) => el.t < vantageDate.getTime());
    const vantageAggregateBinaryForecast = possibleAggregateEl ? possibleAggregateEl.x1.q2 : q.community_prediction.history[0].x1.q2;

    return {
      id: `${platformName}-${q.id}`,
      vantageAggregateBinaryForecast: vantageAggregateBinaryForecast || null,
      vantageDate,
      binaryResolution: q.resolution === 1,
    };
  };

  if (apiQuestion.type === "group") {
    await sleep(SLEEP_TIME);
    const apiQuestionDetails = await fetchSingleApiQuestion(apiQuestion.id);
    if (apiQuestionDetails.type !== "group") {
      throw new Error("Expected `group` type"); // shouldn't happen, this is mostly for typescript
    }
    return (apiQuestionDetails.sub_questions || [])
      .filter((q) => !skip(q))
      .map((sq) => {
        const tmp = buildFetchedQuestion(sq);
        return {
          ...tmp,
          title: `${apiQuestion.title} (${sq.title})`,
          description: apiQuestionDetails.description || "",
          url: `https://www.metaculus.com${apiQuestion.page_url}?sub-question=${sq.id}`,
        };
      });
  } else if (apiQuestion.type === "forecast") {
    if (apiQuestion.group) {
      return []; // sub-question, should be handled on the group level
    }
    if (skip(apiQuestion)) {
      return [];
    }

    await sleep(SLEEP_TIME);
    const apiQuestionDetails = await fetchSingleApiQuestion(apiQuestion.id);
    const tmp = buildFetchedQuestion(apiQuestion);
    return [
      {
        ...tmp,
        title: apiQuestion.title,
        description: apiQuestionDetails.description || "",
        url: "https://www.metaculus.com" + apiQuestion.page_url,
      },
    ];
  } else {
    if (apiQuestion.type !== "claim") {
      // should never happen, since `discriminator` in JTD schema causes a strict runtime check
      console.log(
        `Unknown metaculus question type: ${(apiQuestion as any).type
        }, skipping`
      );
    }
    return [];
  }
}

export const metaculus: Platform<"id" | "debug"> = {
  name: platformName,
  label: "Metaculus",
  color: "#006669",
  version: "pastcast",
  fetcherArgs: ["id", "debug"],
  async fetcher(opts) {
    let allQuestions: FetchedPastcastQuestion[] = [];

    if (opts.args?.id) {
      const id = Number(opts.args.id);
      const apiQuestion = await fetchSingleApiQuestion(id);
      const questions = await apiQuestionToFetchedQuestions(apiQuestion);
      console.log(questions);
      return {
        questions,
        partial: true,
      };
    }

    let next: string | null = "https://www.metaculus.com/api2/questions/";
    let i = 1;
    while (next) {
      console.log(`\nQuery #${i} - ${next}`);

      await sleep(SLEEP_TIME);
      const apiQuestions: ApiMultipleQuestions = await fetchApiQuestions(next);
      const results = apiQuestions.results;

      let j = false;

      for (const result of results) {
        const questions = await apiQuestionToFetchedQuestions(result);
        for (const question of questions) {
          console.log(`- ${question.title}`);
          if ((!j && i % 20 === 0) || opts.args?.debug) {
            console.log(question);
            j = true;
          }
          allQuestions.push(question);
        }
      }

      next = apiQuestions.next;
      i += 1;
      if (i === 2) break;
    }

    return {
      questions: allQuestions,
      partial: false,
    };
  },
};