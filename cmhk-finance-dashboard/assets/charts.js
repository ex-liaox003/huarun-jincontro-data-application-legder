(function() {
  'use strict';

  var BLUE = '#1a5fb4';
  var BLUE_LIGHT = '#4a9eff';
  var BLUE_BG = '#e6f0ff';
  var GREEN = '#52c41a';
  var ORANGE = '#ff9c00';
  var GRAY = '#ccc';
  var TEXT = '#333';
  var TEXT_MUTED = '#999';

  // ===== 利润总额大环形图 =====
  var profitGauge = echarts.init(document.getElementById('profitGauge'), null, { renderer: 'svg' });
  profitGauge.setOption({
    animation: false,
    series: [{
      type: 'pie',
      radius: ['72%', '88%'],
      center: ['50%', '50%'],
      startAngle: 90,
      label: { show: false },
      labelLine: { show: false },
      data: [
        {
          value: 58.36,
          name: '完成度',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4a9eff' },
              { offset: 1, color: '#1a5fb4' }
            ])
          }
        },
        {
          value: 41.64,
          name: '剩余',
          itemStyle: { color: '#e8edf5' }
        }
      ]
    }, {
      type: 'pie',
      radius: ['0%', '0%'],
      center: ['50%', '50%'],
      label: {
        show: true,
        position: 'center',
        formatter: function() {
          return '{val|58.36%}\n{lbl|完成度}';
        },
        rich: {
          val: { fontSize: 26, fontWeight: 'bold', color: BLUE, lineHeight: 32 },
          lbl: { fontSize: 12, color: TEXT_MUTED }
        }
      },
      data: [{ value: 1 }]
    }]
  });

  // ===== 近5年年度波动柱状图 =====
  var yearChart = echarts.init(document.getElementById('yearChart'), null, { renderer: 'svg' });
  yearChart.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['本年累计'],
      bottom: 8,
      textStyle: { fontSize: 11, color: TEXT_MUTED },
      itemWidth: 12,
      itemHeight: 8
    },
    grid: { left: 45, right: 20, top: 30, bottom: 52 },
    xAxis: {
      type: 'category',
      data: ['2022年', '2023年', '2024年', '2025年', '2026年'],
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: { fontSize: 11, color: TEXT_MUTED },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { fontSize: 10, color: TEXT_MUTED }
    },
    series: [{
      name: '本年累计',
      type: 'bar',
      barWidth: 28,
      data: [
        { value: 82.35, itemStyle: { color: '#4a9eff' } },
        { value: 88.17, itemStyle: { color: '#4a9eff' } },
        { value: 91.62, itemStyle: { color: '#4a9eff' } },
        { value: 95.43, itemStyle: { color: '#4a9eff' } },
        { value: 55.68, itemStyle: { color: '#1a5fb4' } }
      ],
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: TEXT_MUTED,
        formatter: function(p) { return p.value; }
      }
    }]
  });

  // ===== 近12月月度波动混合图 =====
  var monthChart = echarts.init(document.getElementById('monthChart'), null, { renderer: 'svg' });
  monthChart.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['本月数', '月度同比'],
      bottom: 8,
      textStyle: { fontSize: 11, color: TEXT_MUTED },
      itemWidth: 12,
      itemHeight: 8
    },
    grid: { left: 50, right: 45, top: 30, bottom: 52 },
    xAxis: {
      type: 'category',
      data: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: { fontSize: 10, color: TEXT_MUTED },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { fontSize: 10, color: TEXT_MUTED }
      },
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          fontSize: 10,
          color: TEXT_MUTED,
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '本月数',
        type: 'bar',
        barWidth: 14,
        data: [8.2, 7.5, 9.1, 6.8, 9.6, 5.2, 6.3, 4.8, 8.5, 7.1, 9.3, 7.2],
        itemStyle: { color: '#ff9c00' }
      },
      {
        name: '月度同比',
        type: 'line',
        yAxisIndex: 1,
        data: [6.3, 4.1, 9.8, 2.5, 15.2, -3.1, 5.7, 1.2, 8.4, 4.6, 11.3, 7.8],
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#4a9eff', width: 2 },
        itemStyle: { color: '#4a9eff' }
      }
    ]
  });

  // ===== KPI小环形图配置 =====
  function createSmallGauge(id, value, color) {
    var chart = echarts.init(document.getElementById(id), null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      series: [{
        type: 'pie',
        radius: ['68%', '85%'],
        center: ['50%', '50%'],
        startAngle: 90,
        label: { show: false },
        labelLine: { show: false },
        data: [
          {
            value: value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color[0] },
                { offset: 1, color: color[1] }
              ])
            }
          },
          {
            value: 100 - value,
            itemStyle: { color: '#e8edf5' }
          }
        ]
      }, {
        type: 'pie',
        radius: ['0%', '0%'],
        center: ['50%', '50%'],
        label: {
          show: true,
          position: 'center',
          formatter: function() {
            return '{val|' + value.toFixed(2) + '%}';
          },
          rich: {
            val: { fontSize: 14, fontWeight: 'bold', color: color[1] }
          }
        },
        data: [{ value: 1 }]
      }]
    });
    return chart;
  }

  createSmallGauge('gauge1', 52.38, ['#52c41a', '#389e0d']);
  createSmallGauge('gauge2', 55.14, ['#52c41a', '#389e0d']);
  createSmallGauge('gauge3', 96.85, ['#4a9eff', '#1a5fb4']);
  createSmallGauge('gauge4', 52.73, ['#4a9eff', '#1a5fb4']);
  createSmallGauge('gauge5', 89.63, ['#ff9c00', '#d46b08']);

  // ===== KPI趋势折线图配置 =====
  function createTrendChart(id, data, color) {
    var chart = echarts.init(document.getElementById(id), null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      grid: { left: 0, right: 0, top: 5, bottom: 18 },
      xAxis: {
        type: 'category',
        data: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: true, fontSize: 9, color: '#999', interval: 2 }
      },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: color, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' }
          ])
        }
      }]
    });
    return chart;
  }

  // 营业收入趋势（亿元）
  createTrendChart('trend1', [16.8, 15.2, 17.5, 14.9, 18.1, 15.6, 16.3, 14.7, 17.8, 16.1, 18.5, 17.2], '#4a9eff');
  // 净利润趋势（亿元）
  createTrendChart('trend2', [5.2, 4.8, 5.6, 4.5, 5.9, 4.1, 4.7, 3.9, 5.5, 4.6, 5.8, 5.1], '#4a9eff');
  // 资产总额趋势（亿元）
  createTrendChart('trend3', [5680, 5720, 5760, 5810, 5860, 5910, 5960, 5980, 6020, 6060, 6100, 6152], '#4a9eff');
  // ROE趋势（%）
  createTrendChart('trend4', [6.8, 7.1, 7.5, 7.8, 8.1, 8.3, 8.5, 8.7, 8.9, 9.1, 9.3, 9.58], '#4a9eff');
  // 有息债务趋势（亿元）
  createTrendChart('trend5', [3280, 3310, 3340, 3360, 3390, 3420, 3450, 3470, 3500, 3520, 3550, 3478], '#ff9c00');

  // ===== 响应式 =====
  window.addEventListener('resize', function() {
    profitGauge.resize();
    yearChart.resize();
    monthChart.resize();
    ['gauge1','gauge2','gauge3','gauge4','gauge5'].forEach(function(id) {
      var c = echarts.getInstanceByDom(document.getElementById(id));
      if (c) c.resize();
    });
    ['trend1','trend2','trend3','trend4','trend5'].forEach(function(id) {
      var c = echarts.getInstanceByDom(document.getElementById(id));
      if (c) c.resize();
    });
  });

})();
