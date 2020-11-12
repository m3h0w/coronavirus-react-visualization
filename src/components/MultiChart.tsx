import { observer } from 'mobx-react-lite';
import React, { FC } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis } from 'recharts';
import { useTheme } from '@material-ui/core/styles';
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';
import { xsDown } from '../utils/breakpoints';
import getBrush from './Dashboard/Brush';
import Title from './Dashboard/Title';
import getTooltip from './Dashboard/Tooltip';
import getYAxis from './Dashboard/YAxis';
import useDataStore, { getCapitaScaleString } from '../data/dataStore';
import { Typography } from '@material-ui/core';

export type Row = {
  [key in Column]: string;
};

type Column = 'Province/State' | 'Country/Region' | 'Lat' | 'Long' | string;

interface IProps {
  title: string;
  yLabel: string;
  countries: string[];
  colors: { [country: string]: string };
  syncId: string;
  dataType: 'confirmed' | 'dead';
  logScale: boolean;
  perCapita: boolean;
}

const MultiChart: FC<IProps> = observer(
  ({ title, yLabel, countries, dataType, colors, syncId, logScale, perCapita }) => {
    const theme = useTheme();
    const dataStore = useDataStore();
    const data = dataStore.dataForAfter100Cases(dataType, countries);

    const CustomizedDot = (props: any) => {
      const { cx, cy, stroke, payload, lastX, country } = props;
      if (payload.time === lastX) {
        return (
          <>
            <svg x={cx - 5} y={cy - 5} width={50} height={50} fill={stroke} viewBox='0 0 1024 1024'>
              <path
                d='
               M 100, 100
               m -75, 0
               a 75,75 0 1,0 150,0
               a 75,75 0 1,0 -150,0
               '
              />
            </svg>
            <svg
              x={cx - 25}
              y={cy - 28}
              width={100}
              height={50}
              fill={stroke}
              viewBox='-200 -400 1024 1024'
            >
              <text
                fill={stroke}
                style={{ fontSize: '200px' }}
                dominantBaseline='middle'
                textAnchor='middle'
              >
                {country}
              </text>
            </svg>
          </>
        );
      }

      return <div></div>;
    };

    const getFormattedLine = (dot: boolean = true) => {
      if (!data) {
        return null;
      }

      return countries.map((country: string, i: number) => {
        const values = Object.values(data.map((el) => el[country])).filter((v) => v !== undefined);
        const times = Object.values(data.map((el) => el.time));
        return (
          <Line
            animationDuration={500}
            key={i}
            type='monotone'
            dataKey={country}
            name={country}
            stroke={colors[country]}
            dot={dot && <CustomizedDot lastX={times[values.length - 1]} country={country} />}
            strokeWidth={1.5}
            opacity={0.8}
          />
        );
      });
    };

    const brush =
      Boolean(countries.length) &&
      data &&
      getBrush({
        data: data,
        color: theme.palette.text.secondary,
        dataKey: 'time',
        children: (
          <LineChart>
            {getYAxis(yLabel, logScale, true)}
            {getFormattedLine(false)}
          </LineChart>
        ),
      });

    return (
      <>
        <div
          style={{
            display: 'flex',
            alignItem: 'end',
            justifyContent: 'space-between',
            flexDirection: 'column',
            width: '100%',
            marginBottom: '10px',
          }}
        >
          <Title>
            {title} {logScale ? (xsDown() ? '(log)' : '(logarithmic scale)') : null}
          </Title>
          <Typography variant='caption' style={{ marginTop: -15 }}>
            {perCapita ? `per ${getCapitaScaleString()} inhabitants` : ''}
          </Typography>
        </div>
        <ResponsiveContainer width={'100%'}>
          {Boolean(countries.length) ? (
            <LineChart
              data={data}
              margin={{
                top: 16,
                right: 0,
                bottom: 10,
                left: 0,
              }}
              syncId={syncId}
            >
              <CartesianGrid strokeDasharray='1 6' />
              <XAxis
                // angle={-15}
                dataKey='time'
                stroke={theme.palette.text.secondary}
                // tickFormatter={formatXAxis}
                domain={['auto', 'dataMax + 2']}
                label={{
                  fontSize: 10,
                  value: 'Days after a 100th case',
                  position: 'insideTopRight',
                  dy: -20,
                }}
                // height={30}
                type={'number'}
              />
              {getYAxis(yLabel, logScale)}
              {getFormattedLine(true)}
              {brush}
              {getTooltip()}
            </LineChart>
          ) : (
            <div></div>
          )}
        </ResponsiveContainer>
      </>
    );
  }
);

// const TIME_FORMAT = 'MMM Do';
// const formatXAxis: TickFormatterFunction = (tickItem: number) =>
//   moment(tickItem * 1000).format(TIME_FORMAT);

export default MultiChart;
