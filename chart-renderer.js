// == Chart Rendering Logic (chart-renderer.js) ==

async function initializeCharts() {
    // 1. 加载 Chart.js 和插件 (如果尚未加载)
    // 使用 Promise 存储加载状态，避免重复加载
    if (!window._chartJsLoadingPromise) {
        window._chartJsLoadingPromise = (async () => {
            if (typeof Chart === 'undefined' || typeof ChartDataLabels === 'undefined') {
                try {
                    console.log("开始加载 Chart.js 和 datalabels 插件...");
                    // 并行加载库文件
                    await Promise.all([
                        import("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js"),
                        import("https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0")
                    ]);
                    // 确保 Chart 和 ChartDataLabels 都已加载
                    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
                        Chart.register(ChartDataLabels);
                        console.log("Chart.js 和插件加载并注册成功。");
                    } else {
                        throw new Error("Chart.js 或插件未能正确加载到全局作用域。");
                    }
                } catch (error) {
                    console.error("加载 Chart.js 库失败:", error);
                    window._chartJsLoadingPromise = null; // 重置 Promise 允许重试
                    throw error; // 抛出错误以便调用者处理
                }
            } else {
                console.log("Chart.js 库已加载。");
                // 即使库已存在，也要确保插件已注册
                 if (typeof ChartDataLabels !== 'undefined' && !Chart.registry.plugins.get('datalabels')) {
                     try {
                         Chart.register(ChartDataLabels);
                         console.log("已注册 ChartDataLabels 插件。");
                     } catch (pluginError) {
                         console.error("注册 ChartDataLabels 插件失败:", pluginError);
                         // 根据情况决定是否抛出错误
                     }
                 }
            }
        })();
    }
     // 等待加载完成
    await window._chartJsLoadingPromise;
  
  
    // 2. 定义成绩图表渲染函数
    function renderScoreChart(dv, targetElement, labels, datasets) {
      // datasets = { 语文: [...], 数学: [...], 英语: [...] }
      const canvas = dv.el("canvas", null, { cls: 'score-chart-canvas' });
      targetElement.appendChild(canvas); // 将 canvas 添加到目标 div
  
      // 应用容器样式 (也可以通过 CSS 类)
      targetElement.style.backgroundColor = '#2C3E50';
      targetElement.style.borderRadius = '15px';
      targetElement.style.padding = '20px';
      targetElement.style.height = '400px';
      targetElement.style.marginBottom = '20px'; // 添加一些间距
  
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: "语文",
              data: datasets.语文,
              backgroundColor: "rgba(255, 107, 107, 0.8)",
              borderColor: "#FF6B6B",
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.8,
              categoryPercentage: 0.8
            },
            {
              label: "数学",
              data: datasets.数学,
              backgroundColor: "rgba(78, 205, 196, 0.8)",
              borderColor: "#4ECDC4",
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.8,
              categoryPercentage: 0.8
            },
            {
              label: "英语",
              data: datasets.英语,
              backgroundColor: "rgba(69, 183, 209, 0.8)",
              borderColor: "#45B7D1",
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.8,
              categoryPercentage: 0.8
            }
          ]
        },
        options: { // 从原代码复制 options
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 30,
              right: 20,
              bottom: 10,
              left: 20
            }
          },
          plugins: {
            title: {
              display: true,
              text: "学习成绩趋势", // 可以考虑让标题也成为配置项
              color: '#ECF0F1',
              font: {
                size: 16,
                weight: 'bold',
                family: "'PingFang SC', 'Microsoft YaHei', sans-serif"
              },
              padding: {
                bottom: 30
              }
            },
            legend: {
              position: "top",
              align: "center",
              labels: {
                usePointStyle: true,
                padding: 20,
                color: '#ECF0F1',
                font: {
                  family: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(44, 62, 80, 0.9)',
              titleColor: '#ECF0F1',
              bodyColor: '#ECF0F1',
              padding: 12,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.parsed.y + ' 分';
                }
              }
            },
            datalabels: {
              display: true,
              color: '#ECF0F1',
              anchor: 'end',
              align: 'top',
              offset: 0,
              font: {
                family: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                size: 12,
                weight: 'bold'
              },
              formatter: function(value) {
                return value;
              },
              padding: {
                top: 5
              }
            }
          },
          scales: {
            y: {
              min: 60,
              max: 100,
              grid: {
                color: 'rgba(236, 240, 241, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#ECF0F1',
                font: {
                  size: 11
                },
                padding: 8,
                callback: function(value) {
                  return value + ' 分';
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#ECF0F1',
                font: {
                  size: 11
                },
                padding: 8
              }
            }
          }
        }
      });
    }
  
    // 3. 定义排名图表渲染函数
    function renderRankChart(dv, targetElement, labels, datasets) {
        // datasets = { 班级排名: [...], 年级排名: [...] }
        const canvas = dv.el("canvas", null, { cls: 'rank-chart-canvas' });
        targetElement.appendChild(canvas); // 将 canvas 添加到目标 div
  
        // 应用容器样式
        targetElement.style.backgroundColor = '#2C3E50';
        targetElement.style.borderRadius = '15px';
        targetElement.style.padding = '20px';
        targetElement.style.height = '400px';
        // targetElement.style.marginTop = '20px'; // marginTop 移到本地控制
  
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "班级排名",
                        data: datasets.班级排名,
                        borderColor: "#FF6B6B",
                        backgroundColor: "rgba(255, 107, 107, 0.1)",
                        borderWidth: 3,
                        pointBackgroundColor: "#FF6B6B",
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        yAxisID: 'y1',
                        tension: 0.1,
                        fill: true // 可以选择填充区域
                    },
                    {
                        label: "年级排名",
                        data: datasets.年级排名,
                        borderColor: "#4ECDC4",
                        backgroundColor: "rgba(78, 205, 196, 0.1)",
                        borderWidth: 3,
                        pointBackgroundColor: "#4ECDC4",
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        yAxisID: 'y2',
                        tension: 0.1,
                        fill: true // 可以选择填充区域
                    }
                ]
            },
            options: { // 从原代码复制 options
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 30,
                        right: 20,
                        bottom: 10,
                        left: 20
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: "排名趋势变化", // 可以考虑让标题也成为配置项
                        color: '#ECF0F1',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: "'PingFang SC', 'Microsoft YaHei', sans-serif"
                        },
                        padding: {
                            bottom: 30
                        }
                    },
                    legend: {
                        position: "top",
                        align: "center",
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: '#ECF0F1',
                            font: {
                                family: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#ECF0F1',
                        bodyColor: '#ECF0F1',
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': 第' + context.parsed.y + '名';
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#ECF0F1',
                        anchor: function(context) {
                          // 向上或向下偏移，避免重叠
                          return context.datasetIndex === 0 ? 'end' : 'end';
                        },
                        align: function(context) {
                          // 都在点的上方
                          return 'top';
                        },
                        offset: 8, // 统一向上偏移
                        font: {
                            family: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                            size: 14, // 稍微调大一点
                            weight: 'bold'
                        },
                        formatter: function(value, context) {
                            return '第' + value + '名';
                        },
                        backgroundColor: function(context) {
                            // 使用对应线条的颜色作为背景
                            return context.dataset.borderColor; // 使用 borderColor 而不是固定颜色
                        },
                        borderRadius: 4,
                        padding: 6
                    }
                },
                scales: {
                    y1: { // 班级排名轴 (左侧)
                        type: 'linear',
                        position: 'left',
                        reverse: true, // 排名越高越靠上
                        min: 1, // 最小排名
                        // max: 30, // 可以动态计算最大值 + 缓冲
                        suggestedMax: Math.max(10, ...datasets.班级排名) + 5, // 动态计算最大值，至少为10，加5缓冲
                        grid: {
                            color: 'rgba(236, 240, 241, 0.1)',
                            drawBorder: false,
                            drawOnChartArea: true // 在图表区绘制网格线
                        },
                        ticks: {
                            color: '#FF6B6B', // 轴标签颜色
                            font: {
                                size: 12
                            },
                            padding: 8,
                            callback: function(value) {
                                if (Number.isInteger(value)) { // 只显示整数刻度
                                    return '第' + value + '名';
                                }
                            },
                            stepSize: 5 // 大致步长
                        },
                        title: {
                            display: true,
                            text: '班级排名',
                            color: '#FF6B6B',
                            font: {
                                size: 14
                            }
                        }
                    },
                    y2: { // 年级排名轴 (右侧)
                        type: 'linear',
                        position: 'right',
                        reverse: true, // 排名越高越靠上
                        min: 1,
                        // max: 100, // 动态计算
                        suggestedMax: Math.max(50, ...datasets.年级排名) + 10, // 动态计算最大值，至少为50，加10缓冲
                        grid: {
                            drawOnChartArea: false // 不绘制此轴的网格线，避免混乱
                        },
                        ticks: {
                            color: '#4ECDC4', // 轴标签颜色
                            font: {
                                size: 12
                            },
                            padding: 8,
                            callback: function(value) {
                                if (Number.isInteger(value)) {
                                    return '第' + value + '名';
                                }
                            },
                            stepSize: 20 // 大致步长
                        },
                        title: {
                            display: true,
                            text: '年级排名',
                            color: '#4ECDC4',
                            font: {
                                size: 14
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false // 不显示 x 轴网格线
                        },
                        ticks: {
                            color: '#ECF0F1',
                            font: {
                                size: 12
                            },
                            padding: 8
                        }
                    }
                }
            }
        });
    }
  
  
    // 4. 返回包含渲染函数的对象
    return { renderScoreChart, renderRankChart };
  }
  
  // 将初始化函数暴露出去，以便在 DataviewJS 中调用
  return initializeCharts;
  