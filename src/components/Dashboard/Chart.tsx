import moment, { Moment } from 'moment';
import React, { FC, useEffect, useState, ReactText } from 'react';
import ReactCountryFlag from 'react-country-flag';
import {
  Bar,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  TickFormatterFunction,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts';

import { useTheme } from '@material-ui/core/styles';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';
import countryToCode from '../../utils/countryToCode';
import { FIRST_DATE, momentToFormat } from '../../utils/getDatesFromDataRow';
import getBrush from './Brush';
import Title from './Title';
import getTooltip from './Tooltip';
import getYAxis from './YAxis';
import numberWithCommas from '../../utils/numberWithCommas';
import useDataStore from '../../data/dataStore';
import { getCapitaScaleString } from '../../data/dataStore';
import { Typography } from '@material-ui/core';

export type Row = {
  [key in Column]: string;
};

type Column = 'Province/State' | 'Country/Region' | 'Lat' | 'Long' | string;

interface IProps {
  rowData: { confirmed: Row; dead: Row };
  dates: Moment[];
  showingDataFor: string;
}

const Chart: FC<IProps> = ({ rowData, dates, showingDataFor }) => {
  const theme = useTheme();
  // const [firstCaseDate, setFirstCaseDate] = useState();
  const [data, setData] = useState();
  const dataStore = useDataStore();
  const [perCapita, setPerCapita] = useQueryParam<boolean>(
    'per_capita',
    withDefault(BooleanParam, false)
  );

  useEffect(() => {
    if (rowData && rowData.confirmed && rowData.dead) {
      let lastZeroDay: Moment | undefined = moment(FIRST_DATE);
      const d = dates
        .map((date) => {
          const confirmedCases = Number(rowData.confirmed[momentToFormat(date)]);
          let deaths = Number(rowData.dead[momentToFormat(date)]);
          if (deaths === undefined || deaths === null) {
            deaths = 0;
          }
          let fatalityRate: number | undefined;
          if (!perCapita) {
            if (deaths === 0) {
              fatalityRate = 0;
            } else {
              fatalityRate = confirmedCases
                ? Math.round(((deaths / confirmedCases) * 100 + Number.EPSILON) * 100) / 100
                : undefined;
            }
          }

          if (lastZeroDay?.isSame(moment(FIRST_DATE)) && confirmedCases > 0) {
            lastZeroDay = date.clone();
            lastZeroDay.subtract(2, 'days');
          }
          return {
            confirmedCases,
            deaths,
            fatalityRate,
            time: date.unix(),
          };
        })
        .filter((el) => {
          return moment(el.time * 1000).isAfter(lastZeroDay);
        });
      setData(d);
      // setFirstCaseDate(lastZeroDay);
    }
  }, [rowData, dates, perCapita]);

  const getFormattedLine = (
    dataKey,
    name,
    stroke?: string,
    dot: boolean = true,
    yAxisId: 'left' | 'right' = 'left'
  ) => (
    <Line
      type='monotone'
      dataKey={dataKey}
      name={name}
      stroke={stroke || theme.palette.primary.main}
      dot={dot}
      strokeWidth={2}
      yAxisId={yAxisId}
    />
  );

  // const lines = [
  //   getFormattedLine('confirmedCases', 'Confirmed cases'),
  //   getFormattedLine('deaths', 'Deaths', '#000'),
  // ];

  const bars = [
    <Bar
      dataKey={'confirmedCases'}
      name={'Confirmed cases'}
      stackId={'a'}
      fill={theme.palette.primary.main}
      key={0}
    />,
    <Bar dataKey={'deaths'} name={'Deaths'} stackId={'a'} fill={'#000'} key={1} />,
  ];

  const brush = getBrush({
    data,
    color: theme.palette.text.secondary,
    tickFormatter: formatXAxis,
    dataKey: 'time',
    children: (
      <ComposedChart>
        <YAxis hide domain={[0, 'auto']} />
        {bars}
      </ComposedChart>
    ),
  });

  if (!data) {
    return null;
  }

  const cc = countryToCode(showingDataFor);

  return (
    <>
      <Title>
        {`Cases & Deaths`}
        {showingDataFor && `: ${showingDataFor} `}
        {cc && <ReactCountryFlag countryCode={cc} svg style={{ marginTop: -5 }} />}
      </Title>
      <Typography variant='caption' style={{ marginTop: -15 }}>
        {perCapita ? ` per ${getCapitaScaleString()} inhabitants` : ''}
      </Typography>
      <ResponsiveContainer width={'100%'}>
        <ComposedChart
          data={data}
          margin={{
            top: 16,
            right: 0,
            bottom: 10,
            left: 0,
          }}
        >
          <CartesianGrid strokeDasharray='1 3' />
          <XAxis
            angle={-15}
            dataKey='time'
            stroke={theme.palette.text.secondary}
            tickFormatter={formatXAxis}
          />
          {getYAxis('No. of cases & deaths', undefined, undefined, undefined, undefined, false)}
          {!perCapita &&
            getYAxis('Case fatality rate [%]', false, undefined, 'right', false, false, [
              0,
              (v: number) => Math.ceil(v * 1.1),
            ])}
          {/* {lines} */}
          {bars}
          {!perCapita &&
            getFormattedLine(
              'fatalityRate',
              'Case fatality rate',
              theme.palette.secondary.main,
              false,
              'right'
            )}
          {brush}
          {getTooltip(formatXAxis, (value: string | number | ReactText[], name: string) => {
            if (value === undefined || value === null) {
              return '-';
            }
            if (name === 'Case fatality rate') {
              return `${value}%`;
            }
            return numberWithCommas(value);
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
};

const TIME_FORMAT = 'MMM Do';
const formatXAxis: TickFormatterFunction = (tickItem: number) =>
  moment(tickItem * 1000).format(TIME_FORMAT);

export default Chart;
