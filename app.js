var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user'); // signin & signup
var areaRouter = require('./routes/AreaData').router; // stacked area chart
var moneyLine = require('./routes/MoneyData').router; // line chart
var heatmapRouter = require('./routes/HeatmapData').router; // heatmap
var seg2Data = require('./routes/seg2Data').router; // seg2 chart
var DonutData = require('./routes/DonutChart').router; // 도넛차트
var power_factor = require('./routes/power_factor').router; // 역률차트

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', userRouter);
app.use('/segData', areaRouter);
app.use('/moneyData', moneyLine);
app.use('/heatmapData', heatmapRouter);
app.use('/seg2Data', seg2Data);
app.use('/segData', DonutData);
app.use('/segData', power_factor);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createErrcor(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
