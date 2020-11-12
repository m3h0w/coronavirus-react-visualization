import clsx from 'clsx';
import Dashboard from 'components/Dashboard/Dashboard';
import { observer } from 'mobx-react-lite';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router';
import ReactTooltip from 'react-tooltip';
import {
  ButtonBase,
  Card,
  Grow,
  Hidden,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Collapsable from '../components/Collapsable';
import Chart from '../components/Dashboard/Chart';
import CurrentCount from '../components/Dashboard/CurrentCount';
import { CustomAutocomplete } from '../components/Dashboard/Select';
import UsaMapChart from '../components/UsaMapChart';
import useDataStore from '../data/dataStore';
import { animationTime, GLOBAL_PAPER_OPACITY, US_NAME } from '../utils/consts';
import last from '../utils/last';
import createPersistedState from '../utils/memoryState';
import numberWithCommas from '../utils/numberWithCommas';
import { useQueryParam, withDefault, StringParam, BooleanParam } from 'use-query-params';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
    color: 'white',
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 15,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    opacity: `${GLOBAL_PAPER_OPACITY} !important`,
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    opacity: `${GLOBAL_PAPER_OPACITY} !important`,
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'visible',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 400,
    maxHeight: '80vh',
  },
}));

const DashboardPage: FC<RouteComponentProps> = observer((props) => {
  const classes = useStyles();
  const [selectedCountry, setSelectedCountry] = useQueryParam<string>(
    'country',
    withDefault(StringParam, US_NAME)
  );
  const [selectedRegion, setSelectedRegion] = useQueryParam<string>(
    'region',
    withDefault(StringParam, '')
  );
  const [perCapita, setPerCapita] = useQueryParam<boolean>(
    'per_capita',
    withDefault(BooleanParam, false)
  );
  const dataStore = useDataStore();
  const possibleCountries = dataStore.possibleCountries;
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);
  const history = useHistory();
  const theme = useTheme();
  const [tooltipContent, setTooltipContent] = useState();

  if (perCapita && selectedRegion) {
    setSelectedRegion('');
  }

  const selectCountry = useCallback(
    (country: string) => {
      if (possibleCountries.includes(country)) {
        setSelectedCountry(country);
        setSelectedRegion('');
      }
    },
    [setSelectedRegion, setSelectedCountry, possibleCountries]
  );

  const selectRegion = (region: string) => {
    if (dataStore.possibleRegions.includes(region) || region === null) {
      setSelectedRegion(region);
    }
  };

  let rowData = dataStore.getCountryData(selectedCountry);
  if (selectedRegion) {
    rowData = dataStore.getRegionData(selectedRegion);
  }

  const cases =
    (rowData &&
      rowData.confirmed &&
      (Object.values(rowData.confirmed)[Object.values(rowData.confirmed).length - 1] as number)) ||
    0;
  const deaths =
    (rowData &&
      rowData.dead &&
      (Object.values(rowData.dead)[Object.values(rowData.dead).length - 1] as number)) ||
    0;
  const mortalityRate = dataStore.fatalityRateArray
    ? last(dataStore.fatalityRateArray)[selectedCountry]
    : undefined;
  const isUs = selectedCountry === US_NAME;

  const possibleRegionsForSelectedCountry = dataStore.getPossibleRegionsByCountry(
    selectedCountry,
    true
  );
  const hasRegions = Boolean(possibleRegionsForSelectedCountry.length);

  return (
    <Dashboard title='Country dashboard'>
      <Grid item xs={12} md={3}>
        <Slide
          direction='down'
          in={dataStore.ready}
          mountOnEnter
          unmountOnExit
          timeout={animationTime}
        >
          <Paper className={classes.paper} style={{ height: 155 }}>
            <CustomAutocomplete
              label={'Select country'}
              handleChange={(v) => {
                selectCountry(v);
              }}
              selectedValue={selectedCountry}
              possibleValues={dataStore.possibleCountriesSortedByCases}
              id={'select-country'}
              width={'auto'}
            />
            {hasRegions && !perCapita ? (
              <CustomAutocomplete
                label={'Select region'}
                handleChange={selectRegion}
                selectedValue={selectedRegion}
                possibleValues={possibleRegionsForSelectedCountry}
                id={'select-region'}
                width={'auto'}
              />
            ) : null}
          </Paper>
        </Slide>
        <Hidden smDown>
          <div style={{ height: 31 }} />
        </Hidden>
        <Hidden mdUp>
          <div style={{ height: 15 }} />
        </Hidden>
        <Grow in={dataStore.ready} timeout={animationTime}>
          <Paper className={classes.paper} style={{ padding: 0 }}>
            {rowData && rowData.confirmed && rowData.dead && (
              <CurrentCount
                style={{ padding: 15 }}
                confirmedCases={cases}
                deaths={deaths}
                mortalityRate={mortalityRate}
                perCapita={perCapita}
              />
            )}
            {hasRegions && !perCapita ? (
              <Collapsable>
                <Table size='small' aria-label='a dense table'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Region / State</TableCell>
                      <TableCell align='right'>Cases</TableCell>
                      <TableCell align='right'>Deaths</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {possibleRegionsForSelectedCountry.map((region) => {
                      return (
                        <TableRow
                          key={region}
                          onClick={() => {
                            selectRegion(region);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <TableCell component='th' scope='row'>
                            {region}
                          </TableCell>
                          <TableCell align='right'>
                            {numberWithCommas(dataStore.getLastRegionCases(region))}
                          </TableCell>
                          <TableCell align='right'>
                            {numberWithCommas(dataStore.getLastRegionDeaths(region))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Collapsable>
            ) : null}
          </Paper>
        </Grow>
      </Grid>
      <Grid item xs={12} md={9}>
        <Grow in={dataStore.ready} timeout={animationTime}>
          <Paper className={fixedHeightPaper}>
            <Chart
              showingDataFor={selectedRegion || selectedCountry}
              rowData={rowData}
              dates={dataStore.dates}
            />
          </Paper>
        </Grow>
        <div style={{ height: 15 }} />
        <Grow in={dataStore.ready} timeout={animationTime}>
          <Card style={{ width: '100%' }}>
            <ButtonBase
              className={classes.paper}
              style={{
                backgroundColor: theme.palette.secondary.main,
                cursor: 'pointer',
                width: '100%',
              }}
              onClick={() => {
                history.push(`/infection-trajectories/${selectedCountry}`);
              }}
            >
              <Typography variant='h5'>Compare infection trajectories</Typography>
            </ButtonBase>
          </Card>
        </Grow>
      </Grid>
      {isUs && !perCapita && (
        <Grid item xs={12}>
          <Card style={{ position: 'relative' }}>
            <UsaMapChart
              date={last(dataStore.datesConverted)}
              setTooltipContent={setTooltipContent}
              dataType={'confirmed'}
              style={{ maxHeight: '80vh' }}
              onClick={(stateKey) => {
                selectRegion(stateKey);
              }}
              selectedRegion={selectedRegion}
            />
            <Typography
              variant='h4'
              color={'primary'}
              style={{ position: 'absolute', bottom: 0, right: 5 }}
            >
              Confirmed cases
            </Typography>
          </Card>
          <ReactTooltip>{tooltipContent}</ReactTooltip>{' '}
        </Grid>
      )}
      {isUs && !perCapita && (
        <Grid item xs={12}>
          <Card style={{ position: 'relative' }}>
            <UsaMapChart
              date={last(dataStore.datesConverted)}
              setTooltipContent={setTooltipContent}
              dataType={'dead'}
              style={{ maxHeight: '80vh' }}
              onClick={(stateKey) => {
                selectRegion(stateKey);
              }}
              selectedRegion={selectedRegion}
            />
            <Typography
              variant='h4'
              color='initial'
              style={{ position: 'absolute', bottom: 0, right: 5 }}
            >
              Deaths
            </Typography>
          </Card>
          <ReactTooltip>{tooltipContent}</ReactTooltip>
        </Grid>
      )}
    </Dashboard>
  );
});

export default DashboardPage;
