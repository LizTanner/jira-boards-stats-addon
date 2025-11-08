import React, { useEffect, useState } from 'react';
import ForgeReconciler, { useProductContext, Spinner, Stack, Inline, PieChart } from '@forge/react';
import { requestJira } from '@forge/bridge';

const calculateIssueStats = (issues) => {
  const numReporters = issues.reduce((acc, issue) => {
    acc.add(issue.fields.creator.accountId);
    return acc;
  }, new Set()).size;

  const statusCounts = issues.reduce((acc, issue) => {
    const status = issue.fields.status.name;
    acc[status] = acc[status] ? acc[status] + 1 : 1;
    return acc;
  }, {});

  const issueTypeCounts = issues.reduce((acc, issue) => {
    const issueType = issue.fields.issuetype.name;
    acc[issueType] = acc[issueType] ? acc[issueType] + 1 : 1;
    return acc;
  }, {});

  return { numReporters, statusCounts, issueTypeCounts };
};

// Formats count objects with label, value, and color from Forge UI kit palette. Extract-nomod.
const colors = ['lime', 'orange', 'grape_fruit', 'mango'];

const makeVizData = (data) => {
  return Object.entries(data).map(([key, value], idx) => ({ label: key, value, color: colors[idx % colors.length] }));
};

// Describes horizontal and vertical layout of how count data is displayed in the modal. Extract-nomod.
const StatsRow = ({ cells }) => {
  return (
    <Inline space="space.200" spread="space-between">
      {
        cells.map((cell, index) => (
          <Stack key={index} grow="fill">
            {cell}
          </Stack>
        ))
      }
    </Inline>
  );
};

// Added requestBoardIssueData helper function from Jira tutorial app helper.js file. Extract-mod.
const requestBoardIssueData = async (boardId) => {
  const response = await requestJira(`/rest/agile/1.0/board/${boardId}/issue`);
  return await response.json();
};

const ShowStatsContent = ({ board }) => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { total, issues } = await requestBoardIssueData(board.id);
      const stats = calculateIssueStats(issues);
      setResult({
        total,
        ...stats
      });
    };

    fetchStats();
  }, [setResult]);

  if (!result) {
    return <Spinner />;
  }

  const { total, numReporters, statusCounts, issueTypeCounts } = result;

  return (
    <Stack grow='fill' space='space.200'>
      <StatsRow cells={[
        <PieChart
          data={makeVizData(statusCounts)}
          colorAccessor="color"
          labelAccessor="label"
          valueAccessor="value"
          title="Issues grouped by current status"
          showMarkLabels
          showBorder
        />
      ]} />
      <StatsRow cells={[
        <PieChart
          data={makeVizData(issueTypeCounts)}
          colorAccessor="color"
          labelAccessor="label"
          valueAccessor="value"
          title="Issues grouped by types"
          showMarkLabels
          showBorder
        />
      ]} />
    </Stack>
  );
};

// Gets board context and displays stats modal. Extract-mod - removed 'export', replaced 'ShowStatsView' with 'App'.
const App = () => {
  const context = useProductContext();
  if (!context) {
    return <Spinner />;
  }
  const { extension: { board } } = context;

  return <ShowStatsContent board={board} />;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
