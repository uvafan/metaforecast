import { GetServerSideProps, NextPage } from "next";
import NextError from "next/error";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "../../common/Card";
import { Collapsible } from "../../common/Collapsible";
import { CopyParagraph } from "../../common/CopyParagraph";
import { Layout } from "../../common/Layout";
import { Query } from "../../common/Query";
import { QuestionWithHistoryFragment } from "../../fragments.generated";
import { ssrUrql } from "../../urql";
import { getBasePath } from "../../utils";
import { CaptureQuestion } from "../components/CaptureQuestion";
import { IndicatorsTable } from "../components/IndicatorsTable";
import { QuestionChartOrVisualization } from "../components/QuestionChartOrVisualization";
import { QuestionInfoRow } from "../components/QuestionInfoRow";
import { QuestionTitle } from "../components/QuestionTitle";
import { QuestionPageDocument } from "../queries.generated";

interface Props {
  id: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const [ssrCache, client] = ssrUrql();
  const id = context.query.id as string;

  const question =
    (await client.query(QuestionPageDocument, { id }).toPromise()).data
      ?.result || null;

  if (!question) {
    context.res.statusCode = 404;
  }

  return {
    props: {
      urqlState: ssrCache.extractData(),
      id,
    },
  };
};

const Section: React.FC<{ title: string; id?: string }> = ({
  title,
  children,
  id,
}) => (
  <div className="space-y-4 flex flex-col items-start" id={id}>
    <div className="border-b-2 border-gray-200 w-full group">
      <h2 className="text-xl leading-3 text-gray-900">
        <span>{title}</span>
        {id ? (
          <>
            {" "}
            <a
              className="text-gray-300 no-underline hidden group-hover:inline"
              href={`#${id}`}
            >
              #
            </a>
          </>
        ) : null}
      </h2>
    </div>
    <div>{children}</div>
  </div>
);

const EmbedSection: React.FC<{ question: QuestionWithHistoryFragment }> = ({
  question,
}) => {
  const url = getBasePath() + `/questions/embed/${question.id}`;
  return (
    <Section title="Embed" id="embed">
      <CopyParagraph
        text={`<iframe src="${url}" height="600" width="600" frameborder="0" />`}
        buttonText="Copy HTML"
      />
      <div className="mt-2">
        <Collapsible title="Preview">
          {() => <iframe src={url} height="600" width="600" frameBorder="0" />}
        </Collapsible>
      </div>
    </Section>
  );
};

const LargeQuestionCard: React.FC<{
  question: QuestionWithHistoryFragment;
}> = ({ question }) => {
  return (
    <Card highlightOnHover={false} large={true}>
      <QuestionTitle question={question} />

      <div className="mb-5 mt-5">
        <QuestionInfoRow question={question} />
      </div>

      <div className="mb-10">
        <QuestionChartOrVisualization question={question} />
      </div>

      <div className="mx-auto max-w-prose space-y-8">
        <Section title="Question description" id="description">
          <ReactMarkdown
            linkTarget="_blank"
            className="font-normal text-gray-900"
          >
            {question.description.replaceAll("---", "")}
          </ReactMarkdown>
        </Section>
        <Section title="Indicators" id="indicators">
          <IndicatorsTable question={question} />
        </Section>
        <Section title="Capture" id="capture">
          <CaptureQuestion question={question} />
        </Section>
        <EmbedSection question={question} />
      </div>
    </Card>
  );
};

const QuestionPage: NextPage<Props> = ({ id }) => {
  return (
    <Layout page="question">
      <div className="max-w-4xl mx-auto">
        <Query document={QuestionPageDocument} variables={{ id }}>
          {({ data }) =>
            data.result ? (
              <LargeQuestionCard question={data.result} />
            ) : (
              <NextError statusCode={404} />
            )
          }
        </Query>
      </div>
    </Layout>
  );
};

export default QuestionPage;
