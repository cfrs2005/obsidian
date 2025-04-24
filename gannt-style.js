styleTextContent = `
.gantt-container {
  margin-top: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  position: relative;
  width: 100%;
  overflow: hidden; /* 防止水平溢出 */
}
.gantt-header {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.date-range {
  margin-left: auto;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
}
.gantt-stats {
  text-align: center;
  padding: 15px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 8px;
  color: #e0e0e0;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.gantt-chart {
  background: #242424;
  border-radius: 8px;
  padding: 15px;
  overflow: visible;
  box-shadow: 0 4px 8px rgba(0,0,0,0.4);
  position: relative;
  min-height: 500px;
  overflow-x: auto; /* 允许水平滚动 */
  overflow-y: visible; /* 保持垂直方向可见，以显示today标签 */
}
.gantt-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-width: max-content;
  position: relative;
}
.gantt-labels {
  position: relative;
  z-index: 200;
}
.gantt-timeline {
  position: relative;
  z-index: 100;
}
.top-timeline-container {
  display: contents; 
}
.timeline-label-section {
  position: sticky;
  left: 0;
  background: #242424;
  z-index: 200;
  border-bottom: 1px solid #3a3a3a;
  padding-bottom: 5px;
}
.timeline-date-section {
  grid-column: 2;
  position: sticky;
  top: 0;
  z-index: 30;
  background: #242424;
  border-bottom: 1px solid #3a3a3a;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
.timeline-header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  font-weight: bold;
  color: #e0e0e0;
  background: #2a2a2a;
  border-radius: 6px;
  margin: 5px;
}
.timeline-header {
  display: flex;
  padding-bottom: 5px;
}
.month-labels {
  display: flex;
  margin-bottom: 5px;
}
.month-label {
  text-align: center;
  font-weight: bold;
  color: #e0e0e0;
  padding: 5px 0;
  border-bottom: 1px solid #3a3a3a;
}
.day {
  min-width: 25px;
  text-align: center;
  color: #aaa;
  font-size: 12px;
  border-right: 1px solid #333;
}
.weekend {
  background-color: #2a2a2a;
}
.owner-section {
  margin-bottom: 15px;
}
.owner-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  padding: 10px;
  background: linear-gradient(135deg, #2a2a2a 0%, #353535 100%);
  border-radius: 6px;
  margin-bottom: 10px;
  color: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.task-label {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #242424;
  border-radius: 4px 0 0 4px;
  border-right: 1px solid #444;
  display: flex;
  align-items: center;
  color: #e0e0e0;
  height: 32px;
  box-sizing: border-box;
}
.task-label-text {
  max-width: 220px; /* 增加最大宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 5px;
  font-weight: 400; /* 减小字重 */
  letter-spacing: -0.2px; /* 稍微压缩字间距 */
}
.task-timeline {
  position: relative;
  height: 32px;
}
.task-bar {
  position: absolute;
  height: 24px;
  top: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  color: white;
  font-weight: 500;
  font-size: 14px;
}
.status-icon {
  margin-right: 6px;
  font-size: 14px;
}
.collaborator-badges {
  display: flex;
  margin-left: auto;
}
.collaborator-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  margin-left: -5px;
  border: 1px solid rgba(255,255,255,0.2);
  font-weight: bold;
}
.today-line-container {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  z-index: 999 !important;
  pointer-events: none;
  background-color: #ff4081;
  box-shadow: 0 0 12px rgba(255,64,129,0.8);
  animation: todayLinePulse 2s infinite;
}
@keyframes todayLinePulse {
  0% { opacity: 0.6; box-shadow: 0 0 8px rgba(255,64,129,0.6); }
  50% { opacity: 1; box-shadow: 0 0 16px rgba(255,64,129,1); }
  100% { opacity: 0.6; box-shadow: 0 0 8px rgba(255,64,129,0.6); }
}
.today-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%); /* 居中对齐 */
  background-color: #ff4081;
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 0 8px rgba(255,64,129,0.6);
  z-index: 1000;
  font-weight: bold;
}
.today-not-in-range {
  background: rgba(0,0,0,0.3);
  padding: 3px 8px;
  border-radius: 4px;
  z-index: 1000;
}
.title-section {
  margin-bottom: 20px;
  text-align: center;
}
.gantt-title {
  font-size: 24px;
  font-weight: bold;
  color: #e0e0e0;
  margin-bottom: 5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.owner-row, .task-row {
  display: contents;
}
.owner-name-cell {
  position: sticky;
  left: 0;
  background: #242424;
  z-index: 200;
  width: 280px;
  box-shadow: 2px 0 8px rgba(0,0,0,0.4);
  height: 100%;
}
.owner-timeline-cell {
  position: relative;
  z-index: 100;
}
.task-label-cell {
  position: sticky;
  left: 0;
  background: #242424;
  z-index: 200;
  border-right: 1px solid #3a3a3a;
  width: 280px;
  box-shadow: 2px 0 8px rgba(0,0,0,0.4);
}
.task-timeline-cell {
  position: relative;
  z-index: 100;
}
.gantt-labels, .gantt-timeline {
  display: contents;
}
.owner-timeline-row {
  display: contents;
}
.owner-timeline-label-cell {
  position: sticky;
  left: 0;
  background: #242424;
  z-index: 200;
  border-right: 1px solid #3a3a3a;
}
.owner-timeline-date-cell {
  grid-column: 2;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  border-top: 1px solid #3a3a3a;
  padding-top: 5px;
  margin-bottom: 10px;
}
.owner-timeline-date-cell .month-labels {
  margin-bottom: 0;
}
.owner-timeline-date-cell .month-label {
  font-size: 12px;
  padding: 2px 0;
  color: #ccc;
}
.owner-timeline-date-cell .timeline-header {
  padding-bottom: 2px;
}
.owner-timeline-date-cell .day {
  font-size: 10px;
  min-width: 25px;
  color: #aaa;
}
`;