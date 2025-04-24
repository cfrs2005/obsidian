// == 甘特图渲染逻辑 (gantt-chart-logic.js) ==

function initializeGanttChart(dv, container, pages, config) {

    // =============== 常量定义 ===============
    const teamMembers = config.teamMembers || []; // 从配置中获取团队成员
  
    // 任务状态对应的颜色映射
    const statusColors = {
      "done": "#00E676",    // 更鲜艳的绿色 - 已完成
      "active": "#2979FF",  // 更鲜艳的蓝色 - 进行中
      "overdue": "#FF1744", // 鲜艳的红色 - 延期
      "canceled": "#FF9100", // 橙色 - 取消
      "pending": "#78909C"  // 稍微艳丽的灰色 - 待处理
    };
  
    // 任务状态对应的渐变色
    const statusGradients = {
      "done": "linear-gradient(135deg, #00E676 0%, #69F0AE 100%)",    // 鲜艳的绿色渐变
      "active": "linear-gradient(135deg, #2979FF 0%, #82B1FF 100%)",  // 鲜艳的蓝色渐变
      "overdue": "linear-gradient(135deg, #FF1744 0%, #FF5252 100%)", // 鲜艳的红色渐变
      "canceled": "linear-gradient(135deg, #FF9100 0%, #FFAB40 100%)", // 橙色渐变
      "pending": "linear-gradient(135deg, #78909C 0%, #B0BEC5 100%)"  // 艳丽的灰色渐变
    };
  
    // 状态图标映射
    const statusIcons = {
      "done": "✅",
      "active": "▶️",
      "overdue": "⚠️",
      "canceled": "❌",
      "pending": "⏳"
    };
  
    // 人员对应的Emoji (可以考虑也作为配置传入)
    const memberEmojis = config.memberEmojis || {
      "Toy": "🧸",
      "刘永松": "👨‍💻",
      "许成": "👨‍🔧",
      "李磊": "👨‍🚀",
      "王海云": "🧠",
      "周易": "🧙‍♂️",
      "王鑫": "🔧",
      // 可以根据需要添加更多默认值
    };
  
    // =============== 时间窗口计算 ===============
    // 时间窗口现在从配置传入
    const timeWindow = config.timeWindow;
    if (!timeWindow || !timeWindow.startDate || !timeWindow.endDate) {
        console.error("错误：时间窗口配置不完整！");
        container.createEl('div', { text: "错误：时间窗口配置不完整！请检查本地配置。", cls: "gantt-error" });
        return;
    }
  
    // =============== 辅助函数 ===============
  
    // 任务状态判断函数
    function determineTaskStatus(task) {
        // ... (保持不变, 从原代码复制)
        // 首先检查任务的状态标记
        switch(task.status) {
            case 'x':
            case 'X':
            return "done";     // 已完成 [x]
            case '-':
            return "canceled"; // 已取消 [-]
            case '/':
            return "active";   // 进行中 [/]
        }
        
        // 如果没有明确的状态标记，则根据时间和完成状态判断
        const now = new Date(); // 使用外部传入的今天日期可能更准确？但这里简单处理
        
        if (task.completed || task.fullyCompleted) {
            return "done";
        }
        
        if (task.due && now > new Date(task.due)) {
            return "overdue";
        }
        
        if (task.start && now >= new Date(task.start)) {
            return "active";
        }
        
        if (task.scheduled) {
            return "pending";
        }
        
        return "pending"; // 默认状态
    }
  
    // 任务名称处理函数
    function processTaskName(name, teamMembers) {
        // ... (保持不变, 从原代码复制)
        // 移除人名
        teamMembers.forEach(member => {
            name = name.replace(new RegExp(member, 'g'), '');
        });
        
        // 移除可能干扰语法的字符
        name = name.replace(/[:;,()[\]{}]/g, ' ')
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(/\[\[([^\]]+)\]\]/g, '$1')
            .replace(/\[([^\]]+)\]/g, '$1')
            .replace(/[➕⏳🛫📅✅❌]\s*\d{4}-\d{2}-\d{2}/g, '')
            .replace(/- \[[x\/\-\s]\]\s*/i, '')
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ');
        
        // 确保名称不以空格开头或结尾
        return name.trim();
    }
  
    // 从任务文本中提取日期
    function extractDatesFromText(text) {
        // ... (保持不变, 从原代码复制)
        const dates = {
            created: null,
            start: null,
            scheduled: null,
            due: null
        };
        
        // 匹配日期格式：YYYY-MM-DD
        const datePattern = /(\d{4}-\d{2}-\d{2})/g;
        
        // 匹配不同类型的日期标记
        const addMatch = text.match(/➕\s*(\d{4}-\d{2}-\d{2})/);
        const dueMatch = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
        const startMatch = text.match(/🛫\s*(\d{4}-\d{2}-\d{2})/);
        const scheduledMatch = text.match(/⏳\s*(\d{4}-\d{2}-\d{2})/);
        
        // 设置日期
        if (addMatch) dates.created = addMatch[1];
        if (dueMatch) dates.due = dueMatch[1];
        if (startMatch) dates.start = startMatch[1];
        if (scheduledMatch) dates.scheduled = scheduledMatch[1];
        
        // 如果没有特定标记，尝试从文本中提取所有日期
        if (!dates.start && !dates.due) {
            const allDates = text.match(datePattern);
            if (allDates) {
            // 使用第一个日期作为开始日期，最后一个日期作为结束日期
            if (!dates.start) dates.start = allDates[0];
            if (!dates.due) dates.due = allDates[allDates.length - 1];
            }
        }
        
        return dates;
    }
  
    // 获取任务的完整信息
    function enrichTaskInfo(task, teamMembers) { // 传入 teamMembers
        // ... (基本不变, 从原代码复制, 确保传入 teamMembers)
        const rawName = task.text.split(' [[')[0].trim();
        const processedName = processTaskName(rawName, teamMembers);
        const textDates = extractDatesFromText(task.text);
        
        const dates = {
            created: task.created || textDates.created,
            start: task.start || textDates.start,
            scheduled: task.scheduled || textDates.scheduled,
            due: task.due || textDates.due,
            completion: task.completion
        };
        
        // 日期处理逻辑 (保持不变)
        if (dates.completion) {
            dates.end = dates.completion;
        } else {
            dates.end = dates.due;
        }
        if (!dates.start) {
            if (dates.created) dates.start = dates.created;
            else if (dates.scheduled) dates.start = dates.scheduled;
            else if (dates.due) {
                dates.start = dates.due;
                dates.end = null;
            }
        }
        if (dates.start && !dates.end) dates.end = dates.start;
        if (!dates.start && dates.end) dates.start = dates.end;
  
        // 提取负责人时，仅提取display name
        const owners = task.outlinks
            .map(link => link.display || link.path.split('/').pop().replace('.md', '')) // 尝试获取display name，否则用文件名
            .filter(owner => owner && teamMembers.includes(owner)); // 确保负责人非空且在团队列表中
  
        return {
            name: processedName,
            status: determineTaskStatus(task),
            owners: owners, // 使用处理过的 owners
            dates: {
            start: dates.start,
            due: dates.due,
            end: dates.end,
            completion: dates.completion
            },
            metadata: {
            path: task.path,
            section: task.section.subpath,
            position: task.position,
            isSubtask: task.subtasks.length > 0
            }
        };
    }
  
    // 日期格式化函数
    function formatDate(date) {
        // ... (保持不变, 从原代码复制)
        if (!date) return null;
        // 确保是 Date 对象
        if (!(date instanceof Date)) {
            date = parseDate(date);
            if (!date) return null;
        }
        return date.toISOString().split('T')[0];
    }
  
    // 解析日期
    function parseDate(dateStr) {
        // ... (保持不变, 从原代码复制)
        if (!dateStr) return null;
        if (dateStr instanceof Date && !isNaN(dateStr)) return dateStr; // 已经是有效日期对象
  
        try {
            // 尝试直接创建日期对象（适用于ISO格式和标准日期字符串）
            let date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
  
            // 如果是普通的日期字符串（YYYY-MM-DD）
            if (typeof dateStr === 'string') {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    // 注意：月份是从0开始的
                    date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
                     if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
  
            // 如果无法解析，返回null
            console.warn(`警告: 无法解析日期 "${dateStr}" (类型: ${typeof dateStr})`);
            return null;
        } catch (error) {
            console.error(`错误: 解析日期 "${dateStr}" 时出错:`, error);
            return null;
        }
    }
  
  
    // =============== 任务处理逻辑 ===============
    function collectAndProcessTasks(pages, teamMembers, timeWindow) {
        let taskMap = new Map();
        const taskCollectionStartDate = new Date(timeWindow.startDate);
        taskCollectionStartDate.setMonth(taskCollectionStartDate.getMonth() - 2); // 扩大范围
        const taskCollectionEndDate = new Date(timeWindow.endDate);
        taskCollectionEndDate.setMonth(taskCollectionEndDate.getMonth() + 2); // 扩大范围
  
        for (let page of pages) {
            if (page.file.tasks) {
                for (let t of page.file.tasks) {
                    try {
                        const taskInfo = enrichTaskInfo(t, teamMembers); // 传入 teamMembers
                        if (!taskInfo.owners || taskInfo.owners.length === 0) continue; // 确保有负责人且在团队列表
  
                        const startDate = parseDate(taskInfo.dates.start);
                        const endDate = parseDate(taskInfo.dates.end);
  
                        if (!startDate && !endDate) continue;
  
                        const effectiveStartDate = startDate || endDate;
                        const effectiveEndDate = endDate || startDate;
  
                        // 过滤掉完全在收集范围之外的任务
                        if (effectiveEndDate < taskCollectionStartDate || effectiveStartDate > taskCollectionEndDate) continue;
  
                        // 如果任务状态为已完成或已取消，则跳过 (移到渲染前过滤，这里先收集)
                        // if (taskInfo.status === 'done' || taskInfo.status === 'canceled') continue;
  
                        const taskKey = `${taskInfo.name}_${formatDate(effectiveStartDate)}_${formatDate(effectiveEndDate)}`;
  
                        if (!taskMap.has(taskKey)) {
                            taskMap.set(taskKey, {
                                name: taskInfo.name,
                                start: effectiveStartDate,
                                end: effectiveEndDate,
                                status: taskInfo.status,
                                owners: taskInfo.owners,
                                primaryOwner: taskInfo.owners[0], // 第一个作为主要负责人
                                metadata: taskInfo.metadata
                            });
                        } else {
                            const existingTask = taskMap.get(taskKey);
                            taskInfo.owners.forEach(owner => {
                                if (!existingTask.owners.includes(owner)) {
                                    existingTask.owners.push(owner);
                                }
                            });
                            // 可以考虑更新状态等逻辑，如果需要合并的话
                        }
                    } catch (error) {
                      console.error(`处理任务出错: ${t.text}`, error);
                    }
                }
            }
        }
        return Array.from(taskMap.values());
    }
  
    // 将任务按主要负责人分组
    function groupTasksByOwner(tasks, teamMembers) {
        let tasksByOwner = {};
        teamMembers.forEach(member => {
            tasksByOwner[member] = [];
        });
  
        tasks.forEach(task => {
            if (!task.primaryOwner || !teamMembers.includes(task.primaryOwner)) {
                // console.warn(`警告: 任务 "${task.name}" 的负责人 "${task.primaryOwner}" 无效或不在团队列表中`);
                return;
            }
            tasksByOwner[task.primaryOwner].push(task);
        });
        return tasksByOwner;
    }
  
    // =============== CSS 样式 ===============
    const cssStyles = `
        .gantt-container {
            /* ... (保持不变, 从原代码复制) ... */
            margin-top: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            position: relative;
            width: 100%;
            overflow: hidden;
        }
        .gantt-header {
            /* ... (保持不变, 从原代码复制) ... */
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            background: #1a1a1a;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .date-range {
            /* ... (保持不变, 从原代码复制) ... */
            margin-left: auto;
            color: #e0e0e0;
            display: flex;
            align-items: center;
            font-weight: 500;
            font-size: 14px;
        }
        .gantt-stats {
            /* ... (保持不变, 从原代码复制) ... */
            text-align: center;
            padding: 15px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 8px;
            color: #e0e0e0;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .gantt-chart {
            /* ... (保持不变, 从原代码复制) ... */
            background: #242424;
            border-radius: 8px;
            padding: 15px;
            overflow: visible; /* 改回 visible 允许 today 标签溢出 */
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            position: relative; /* 确保 today line 相对此定位 */
            min-height: 300px; /* 调整最小高度 */
            overflow-x: auto; /* 允许水平滚动 */
            overflow-y: visible; /* 保持垂直方向可见 */
        }
        .gantt-grid {
            /* ... (保持不变, 从原代码复制) ... */
            display: grid;
            grid-template-columns: 280px 1fr;
            min-width: max-content; /* 确保内容足够宽时网格扩展 */
            position: relative; /* 允许绝对定位的子元素 */
        }
        .gantt-labels {
            /* ... (保持不变, 从原代码复制) ... */
            position: relative; /* 改为 relative 或 static，sticky 由子元素控制 */
            z-index: 200; /* 提升层级 */
            display: contents; /* 让其子元素直接成为 grid item */
        }
        .gantt-timeline {
            /* ... (保持不变, 从原代码复制) ... */
            position: relative; /* 改为 relative 或 static */
            z-index: 100;
            display: contents; /* 让其子元素直接成为 grid item */
        }
        /* .top-timeline-container { display: contents; } */ /* 这部分似乎不再直接需要 */
        .timeline-label-section {
             /* ... (保持不变, 从原代码复制) ... */
            position: sticky;
            left: 0;
            background: #242424; /* 确保背景遮挡下方内容 */
            z-index: 250; /* 比负责人和任务标签高 */
            grid-column: 1; /* 明确指定在第一列 */
            grid-row: 1; /* 明确指定在第一行 */
            padding-bottom: 5px;
            border-bottom: 1px solid #3a3a3a;
        }
        .timeline-date-section {
             /* ... (保持不变, 从原代码复制) ... */
            grid-column: 2; /* 明确指定在第二列 */
            grid-row: 1; /* 明确指定在第一行 */
            position: sticky;
            top: 0;
            z-index: 30; /* 确保在滚动时位于任务条下方 */
            background: #242424;
            border-bottom: 1px solid #3a3a3a;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .timeline-header-title {
             /* ... (保持不变, 从原代码复制) ... */
            display: flex;
            align-items: center;
            justify-content: center;
            height: 60px; /* 可调整 */
            font-weight: bold;
            color: #e0e0e0;
            background: #2a2a2a;
            border-radius: 6px;
            margin: 5px; /* 可调整 */
        }
        .timeline-header {
             /* ... (保持不变, 从原代码复制) ... */
            display: flex;
            padding-bottom: 5px;
        }
        .month-labels {
             /* ... (保持不变, 从原代码复制) ... */
            display: flex;
            margin-bottom: 5px;
        }
        .month-label {
             /* ... (保持不变, 从原代码复制) ... */
            text-align: center;
            font-weight: bold;
            color: #e0e0e0;
            padding: 5px 0;
            border-bottom: 1px solid #3a3a3a;
            white-space: nowrap; /* 防止换行 */
        }
        .day {
             /* ... (保持不变, 从原代码复制) ... */
            min-width: 25px; /* 保持最小宽度 */
            width: 25px; /* 固定宽度 */
            text-align: center;
            color: #aaa;
            font-size: 12px;
            border-right: 1px solid #333;
            box-sizing: border-box; /* 包含边框和内边距 */
        }
        .day:last-child {
            border-right: none; /* 最后一个日期无右边框 */
        }
        .weekend {
             /* ... (保持不变, 从原代码复制) ... */
            background-color: #2a2a2a;
        }
        .owner-section { /* 这个类似乎没在HTML结构中使用 */
            /* margin-bottom: 15px; */
        }
        .owner-header {
             /* ... (保持不变, 从原代码复制) ... */
            display: flex;
            align-items: center;
            font-weight: bold;
            padding: 10px;
            background: linear-gradient(135deg, #2a2a2a 0%, #353535 100%);
            border-radius: 6px;
            margin-bottom: 10px; /* 和任务行区分 */
            color: #f0f0f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            height: 40px; /* 固定高度 */
            box-sizing: border-box;
        }
        .task-label {
             /* ... (保持不变, 从原代码复制) ... */
            padding: 8px 12px;
            font-size: 14px;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            background: #242424; /* 和父单元格背景一致 */
            /* border-radius: 4px 0 0 4px; */ /* 移除圆角，让单元格控制 */
            /* border-right: 1px solid #444; */ /* 移除边框，让单元格控制 */
            display: flex;
            align-items: center;
            color: #e0e0e0;
            height: 32px; /* 固定高度 */
            box-sizing: border-box;
        }
        .task-label-text {
             /* ... (保持不变, 从原代码复制) ... */
            max-width: 200px; /* 调整宽度以适应 280px 列宽 */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-right: 5px;
            font-weight: 400;
            letter-spacing: -0.2px;
        }
        .task-timeline {
             /* ... (保持不变, 从原代码复制) ... */
            position: relative;
            height: 32px; /* 和标签高度一致 */
            /* background-color: #2d2d2d; */ /* 可选：为时间线行添加背景色 */
            border-bottom: 1px solid #333; /* 可选：任务行之间的分隔线 */
        }
        .task-timeline:last-child {
           border-bottom: none;
        }
        .task-bar {
             /* ... (保持不变, 从原代码复制) ... */
            position: absolute;
            height: 24px; /* 比行高小一点 */
            top: 4px; /* 垂直居中 */
            border-radius: 4px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            color: white;
            font-weight: 500;
            font-size: 14px;
            overflow: hidden; /* 防止内部元素溢出 */
            white-space: nowrap; /* 防止内部文字换行 */
        }
        .status-icon {
             /* ... (保持不变, 从原代码复制) ... */
            margin-right: 6px;
            font-size: 14px;
        }
        .collaborator-badges {
             /* ... (保持不变, 从原代码复制) ... */
            display: flex;
            margin-left: auto;
            padding-left: 5px; /* 和任务条内容保持距离 */
        }
        .collaborator-badge {
             /* ... (保持不变, 从原代码复制) ... */
            width: 18px; /* 稍微调小 */
            height: 18px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px; /* 调小字号 */
            margin-left: -6px; /* 调整重叠 */
            border: 1px solid rgba(255,255,255,0.2);
            font-weight: bold;
            flex-shrink: 0; /* 防止被压缩 */
        }
        .today-line-container {
             /* ... (保持不变, 从原代码复制) ... */
            position: absolute;
            top: 0;
            bottom: 0;
            width: 3px;
            z-index: 500 !important; /* 确保在最上层 */
            pointer-events: none;
            background-color: #ff4081;
            box-shadow: 0 0 12px rgba(255,64,129,0.8);
            animation: todayLinePulse 2s infinite;
        }
        @keyframes todayLinePulse {
            /* ... (保持不变, 从原代码复制) ... */
            0% { opacity: 0.6; box-shadow: 0 0 8px rgba(255,64,129,0.6); }
            50% { opacity: 1; box-shadow: 0 0 16px rgba(255,64,129,1); }
            100% { opacity: 0.6; box-shadow: 0 0 8px rgba(255,64,129,0.6); }
        }
        .today-label {
             /* ... (保持不变, 从原代码复制) ... */
            position: absolute;
            top: -30px; /* 向上偏移，避免遮挡时间线头部 */
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff4081;
            color: white;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 12px;
            white-space: nowrap;
            box-shadow: 0 0 8px rgba(255,64,129,0.6);
            z-index: 1000; /* 比线条更高 */
            font-weight: bold;
        }
        .today-not-in-range {
             /* ... (保持不变, 从原代码复制) ... */
             position: absolute;
             top: 5px;
             right: 10px;
             font-size: 12px;
             color: #ff9800;
             z-index: 100;
             background: rgba(0,0,0,0.6);
             padding: 5px 10px;
             border-radius: 4px;
             pointer-events: none; /* 避免干扰滚动 */
        }
        .title-section {
             /* ... (保持不变, 从原代码复制) ... */
            margin-bottom: 20px;
            text-align: center;
        }
        .gantt-title {
             /* ... (保持不变, 从原代码复制) ... */
            font-size: 24px;
            font-weight: bold;
            color: #e0e0e0;
            margin-bottom: 5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .owner-row, .task-row {
             /* ... (保持不变, 从原代码复制) ... */
            display: contents; /* 核心：让这些逻辑行不影响 grid 布局 */
        }
        .owner-name-cell {
             /* ... (保持不变, 从原代码复制) ... */
            grid-column: 1; /* 明确指定列 */
            position: sticky;
            left: 0;
            background: #242424; /* 背景色 */
            z-index: 200; /* 确保在任务条之上 */
            width: 280px; /* 固定宽度 */
            box-shadow: 2px 0 8px rgba(0,0,0,0.4); /* 右侧阴影 */
            padding-top: 10px; /* 与顶部时间线留出空间 */
            border-bottom: 1px solid #3a3a3a; /* 分隔线 */
        }
        .owner-timeline-cell {
             /* ... (保持不变, 从原代码复制) ... */
            grid-column: 2; /* 明确指定列 */
            position: relative;
            z-index: 100; /* 低于 sticky 的列 */
            padding-top: 10px; /* 与顶部时间线留出空间 */
            border-bottom: 1px solid #3a3a3a; /* 分隔线 */
            height: 60px; /* 调整高度以匹配 .owner-header + margin-bottom */
            box-sizing: border-box;
        }
         /* 清除负责人行最后一个任务后的边框 */
        .owner-name-cell:has(+ .owner-timeline-cell + :not(.task-label-cell)) {
            border-bottom: none;
        }
        .owner-timeline-cell:has(+ :not(.task-label-cell)) {
            border-bottom: none;
        }
  
        .task-label-cell {
             /* ... (保持不变, 从原代码复制) ... */
            grid-column: 1; /* 明确指定列 */
            position: sticky;
            left: 0;
            background: #242424;
            z-index: 200;
            border-right: 1px solid #3a3a3a; /* 右边框 */
            width: 280px;
            box-shadow: 2px 0 8px rgba(0,0,0,0.4);
            border-bottom: 1px solid #333; /* 任务行之间的分隔线 */
        }
        .task-timeline-cell {
             /* ... (保持不变, 从原代码复制) ... */
            grid-column: 2; /* 明确指定列 */
            position: relative;
            z-index: 100;
            border-bottom: 1px solid #333; /* 任务行之间的分隔线 */
        }
        /* 清除最后一个任务行的边框 */
        .task-label-cell:last-of-type {
            border-bottom: none;
        }
        .task-timeline-cell:last-of-type {
            border-bottom: none;
        }
  
        /* 图例样式 */
        .status-legend {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .status-legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .legend-color-box {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .legend-text {
            color: #e0e0e0;
            font-size: 12px;
        }
        .gantt-error {
            color: red;
            font-weight: bold;
            padding: 10px;
            border: 1px solid red;
            background-color: #ffe0e0;
            border-radius: 4px;
        }
    `;
  
    // =============== DOM 渲染逻辑 ===============
  
    // 注入 CSS
    function injectCSS(container, styles) {
        let styleEl = container.querySelector('style#gantt-styles');
        if (!styleEl) {
            styleEl = container.createEl('style', { attr: { id: 'gantt-styles' } });
        }
        styleEl.textContent = styles;
    }
  
    // 生成日期范围
    function generateDateRange(timeWindow) {
        let dates = [];
        let currentDate = new Date(timeWindow.startDate);
        // 确保使用 UTC 日期进行比较和迭代，避免时区问题
        const endDateUTC = new Date(Date.UTC(timeWindow.endDate.getFullYear(), timeWindow.endDate.getMonth(), timeWindow.endDate.getDate()));
  
        while (true) {
            const currentUTC = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
            if (currentUTC > endDateUTC) break;
  
            const dayOfWeek = currentDate.getUTCDay(); // 使用 UTC 获取星期几
            dates.push({
                date: new Date(currentUTC), // 存储 UTC 日期对象
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday
            });
  
            // 移动到下一天
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        return dates;
    }
  
  
    // 生成月份标记
    function generateMonthLabels(dates) {
        const months = {};
        dates.forEach(d => {
            const year = d.date.getUTCFullYear();
            const month = d.date.getUTCMonth(); // 0-11
            const monthKey = `${year}-${month}`;
            if (!months[monthKey]) {
                months[monthKey] = {
                    name: `${year}年${month + 1}月`,
                    count: 0
                };
            }
            months[monthKey].count++;
        });
        return months;
    }
  
    // 创建时间线头部
    function createTimelineHeader(parentElement, dates, months) {
        const monthLabelsEl = parentElement.createEl('div', { cls: 'month-labels' });
        Object.values(months).forEach(month => {
            monthLabelsEl.createEl('div', {
                cls: 'month-label',
                text: month.name,
                attr: { style: `width: ${month.count * 25}px; flex-shrink: 0;` } // 确保不被压缩
            });
        });
  
        const timelineEl = parentElement.createEl('div', { cls: 'timeline-header' });
        dates.forEach(d => {
            const dayClass = d.isWeekend ? 'day weekend' : 'day';
            timelineEl.createEl('div', {
                cls: dayClass,
                text: d.date.getUTCDate().toString() // 使用 UTC 日期
            });
        });
    }
  
    // 添加今日线
    function addTodayLine(chartEl, timeWindow, dates, containerWidth) {
        const realToday = new Date();
        const realTodayDate = new Date(Date.UTC(realToday.getFullYear(), realToday.getMonth(), realToday.getDate())); // 今日 UTC
  
        const startDateUTC = new Date(Date.UTC(timeWindow.startDate.getFullYear(), timeWindow.startDate.getMonth(), timeWindow.startDate.getDate()));
        const endDateUTC = new Date(Date.UTC(timeWindow.endDate.getFullYear(), timeWindow.endDate.getMonth(), timeWindow.endDate.getDate()));
  
        const isTodayInRange = realTodayDate >= startDateUTC && realTodayDate <= endDateUTC;
  
        const dayWidth = 25;
        const labelColumnWidth = 280;
        const totalTimelineWidth = dates.length * dayWidth;
  
        if (isTodayInRange) {
            const daysDiff = Math.floor((realTodayDate - startDateUTC) / (24 * 60 * 60 * 1000));
            const leftPos = daysDiff * dayWidth; // 相对于时间线区域的起始位置
  
            // 创建容器时，其 left 需要考虑标签列的宽度
            const todayLineContainer = chartEl.createEl('div', {
                cls: 'today-line-container',
                attr: {
                    style: `left: ${labelColumnWidth + leftPos}px;` // 最终定位
                }
            });
  
            todayLineContainer.createEl('div', {
                cls: 'today-label',
                text: `今天(${realToday.getMonth() + 1}/${realToday.getDate()})`
                // 样式由 CSS 控制
            });
        } else {
             // 在 chartEl 外部（ganttContainer 内）添加提示可能更好，避免随滚动条移动
             const ganttContainer = chartEl.closest('.gantt-container');
             if (ganttContainer) {
                 let noticeEl = ganttContainer.querySelector('.today-not-in-range');
                 if (!noticeEl) {
                     noticeEl = ganttContainer.createEl('div', { cls: 'today-not-in-range' });
                 }
                 const firstMonth = Object.values(generateMonthLabels(dates))[0]?.name || '';
                 const lastMonth = Object.values(generateMonthLabels(dates)).pop()?.name || '';
                 noticeEl.textContent = `注意：甘特图显示的是${firstMonth}至${lastMonth}，今日(${realToday.toLocaleDateString()})${realTodayDate < startDateUTC ? '早于' : '晚于'}显示范围`;
             }
        }
    }
  
  
    // === 执行主体 ===
  
   
  
    // 2. 收集和处理任务
    const allTasks = collectAndProcessTasks(pages, teamMembers, timeWindow);
    const tasksByOwner = groupTasksByOwner(allTasks, teamMembers);
  
    // 3. 生成日期和月份数据
    const dates = generateDateRange(timeWindow);
    const months = generateMonthLabels(dates);
  
    // 4. 清空容器并创建主结构
    container.innerHTML = ''; // 清空现有内容
     // 调整位置 1. 注入 CSS
    injectCSS(container, cssStyles);
    const ganttContainer = container.createEl('div', { cls: 'gantt-container' });
  
    // 添加标题
    const titleSection = ganttContainer.createEl('div', { cls: 'title-section' });
    titleSection.createEl('h2', { cls: 'gantt-title', text: config.title || '项目进度甘特图' });
  
    // 创建头部 (图例 + 日期范围)
    const header = ganttContainer.createEl('div', { cls: 'gantt-header' });
  
    // 添加状态图例
    const statusLegend = header.createEl('div', { cls: 'status-legend' });
    [
      { status: 'done', text: '已完成' },
      { status: 'active', text: '进行中' },
      { status: 'overdue', text: '已延期' },
      { status: 'canceled', text: '已取消' },
      { status: 'pending', text: '待处理' }
    ].forEach(item => {
        if(config.showStatusLegend === false && (item.status === 'done' || item.status === 'canceled')) return; // 根据配置隐藏已完成/取消
        const legendItem = statusLegend.createEl('div', { cls: 'status-legend-item' });
        legendItem.createEl('div', { cls: 'legend-color-box', attr: { style: `background: ${statusGradients[item.status]};` } });
        legendItem.createEl('span', { cls: 'legend-text', text: item.text });
    });
  
    // 添加日期范围显示
    header.createEl('span', {
        cls: 'date-range',
        text: `时间范围: ${timeWindow.startDate.toLocaleDateString()} - ${timeWindow.endDate.toLocaleDateString()}`
    });
  
  
    // 创建统计信息区
    const statsEl = ganttContainer.createEl('div', { cls: 'gantt-stats' });
    const visibleTasksCount = Object.values(tasksByOwner).flat().filter(task => config.showCompleted !== true ? (task.status !== 'done' && task.status !== 'canceled') : true).length;
    statsEl.createEl('span', { text: `共找到 ${allTasks.length} 个任务，${config.showCompleted !== true ? '当前显示 '+visibleTasksCount+' 个未完成任务' : ''}` });
  
  
    // 创建甘特图区域
    const chartEl = ganttContainer.createEl('div', { cls: 'gantt-chart' });
    const ganttGrid = chartEl.createEl('div', { cls: 'gantt-grid' });
  
    // 添加全局时间线头部 (第一行)
    const timelineLabelSection = ganttGrid.createEl('div', { cls: 'timeline-label-section' });
    timelineLabelSection.createEl('div', { cls: 'timeline-header-title', text: '负责人 / 任务' }); // 左上角标题
  
    const timelineDateSection = ganttGrid.createEl('div', { cls: 'timeline-date-section' });
    createTimelineHeader(timelineDateSection, dates, months); // 创建顶部的时间轴
  
  
    // 为每个负责人添加任务区域 (从第二行开始)
    Object.keys(tasksByOwner).forEach(owner => {
        const ownerTasks = tasksByOwner[owner];
        if (!ownerTasks || ownerTasks.length === 0) return; // 跳过没有任务的成员
  
        const visibleOwnerTasks = ownerTasks.filter(task => config.showCompleted !== true ? (task.status !== 'done' && task.status !== 'canceled') : true);
        if (visibleOwnerTasks.length === 0 && config.showCompleted !== true) return; // 如果不显示已完成且该成员只有已完成任务，则跳过
  
        const ownerEmoji = memberEmojis[owner] || "👤";
  
        // 创建负责人行 (逻辑行)
        const ownerRow = ganttGrid.createEl('div', { cls: 'owner-row' });
  
        // 左侧负责人单元格
        const ownerNameCell = ownerRow.createEl('div', { cls: 'owner-name-cell' });
        const ownerHeader = ownerNameCell.createEl('div', { cls: 'owner-header' });
        ownerHeader.createEl('span', { text: ownerEmoji, attr: { style: 'margin-right: 8px; font-size: 18px;' } });
        ownerHeader.createEl('span', { text: owner, attr: { style: 'font-size: 14px;' } });
  
        // 右侧负责人对应的时间线单元格 (视觉占位)
        ownerRow.createEl('div', { cls: 'owner-timeline-cell' });
  
  
        // 按开始时间对可见任务进行排序
        visibleOwnerTasks.sort((a, b) => {
            const startA = parseDate(a.start) || 0;
            const startB = parseDate(b.start) || 0;
            return startA - startB;
        });
  
        // 添加任务行
        visibleOwnerTasks.forEach(task => {
            const taskStartDate = parseDate(task.start);
            const taskEndDate = parseDate(task.end);
  
            if (!taskStartDate || !taskEndDate) {
                 console.warn(`任务 "${task.name}" 缺少有效日期，已跳过`);
                 return; // 跳过无效日期的任务
            }
  
            // 再次检查是否在视图范围内 (过滤掉完全在外部的)
            const viewStartDate = timeWindow.startDate;
            const viewEndDate = timeWindow.endDate;
            if (taskEndDate < viewStartDate || taskStartDate > viewEndDate) {
                // console.log(`任务 "${task.name}" 不在当前时间窗口内，已跳过`);
                return;
            }
  
  
            // 创建任务行 (逻辑行)
            const taskRow = ganttGrid.createEl('div', { cls: 'task-row' });
  
            // 左侧任务标签单元格
            const taskLabelCell = taskRow.createEl('div', { cls: 'task-label-cell' });
            const taskLabelEl = taskLabelCell.createEl('div', { cls: 'task-label' });
            taskLabelEl.createEl('span', { cls: 'status-icon', text: statusIcons[task.status] || "❓" });
            taskLabelEl.createEl('span', { cls: 'task-label-text', text: task.name || "未命名任务", attr: { title: task.name } });
  
            // 右侧任务时间线单元格
            const taskTimelineCell = taskRow.createEl('div', { cls: 'task-timeline-cell' });
            const taskTimelineEl = taskTimelineCell.createEl('div', { cls: 'task-timeline' });
  
            // --- 计算任务条位置和宽度 ---
            const dayWidth = 25;
            const timelineStartUTC = Date.UTC(viewStartDate.getFullYear(), viewStartDate.getMonth(), viewStartDate.getDate());
  
            // 计算开始位置 (相对于时间线起点)
            const taskStartUTC = Date.UTC(taskStartDate.getFullYear(), taskStartDate.getMonth(), taskStartDate.getDate());
            let startDaysDiff = Math.max(0, Math.floor((taskStartUTC - timelineStartUTC) / (24 * 60 * 60 * 1000)));
            let startPos = startDaysDiff * dayWidth;
  
            // 计算结束位置 (相对于时间线起点)
            const taskEndUTC = Date.UTC(taskEndDate.getFullYear(), taskEndDate.getMonth(), taskEndDate.getDate());
            // 结束日期加1天，因为甘特图通常包含结束那天
            let endDaysDiff = Math.floor((taskEndUTC - timelineStartUTC) / (24 * 60 * 60 * 1000)) + 1;
            // 限制在时间线范围内
            endDaysDiff = Math.min(endDaysDiff, dates.length);
            let endPos = endDaysDiff * dayWidth;
  
            // 计算宽度
            let width = Math.max(dayWidth, endPos - startPos); // 至少为1天的宽度
  
            // 确保宽度不超过时间线总宽度
            width = Math.min(width, dates.length * dayWidth - startPos);
  
  
            const statusGradient = statusGradients[task.status] || "linear-gradient(135deg, #455A64 0%, #607D8B 100%)";
  
            // 创建任务条
            const taskBarEl = taskTimelineEl.createEl('div', {
                cls: 'task-bar',
                attr: {
                    style: `left: ${startPos}px; width: ${width}px; background: ${statusGradient};`
                }
            });
  
            // 添加协作者标签
            if (task.owners.length > 1) {
                const otherOwners = task.owners.filter(o => o !== task.primaryOwner);
                if (otherOwners.length > 0) {
                    const collaboratorBadgesEl = taskBarEl.createEl('div', { cls: 'collaborator-badges' });
                    otherOwners.slice(0, 3).forEach(collaborator => { // 最多显示3个协作者
                        collaboratorBadgesEl.createEl('div', {
                            cls: 'collaborator-badge',
                            text: (memberEmojis[collaborator] ? '' : collaborator.substring(0, 1)), // 如果有 emoji，优先显示 emoji 背景色，否则显示首字母
                            attr: {
                                title: collaborator,
                                style: memberEmojis[collaborator] ? `font-size: 12px; background-color: rgba(0,0,0,0.3);` : '' // Emoji 样式调整
                            },
                            innerHTML: memberEmojis[collaborator] || collaborator.substring(0,1) // 显示Emoji或首字母
                        });
                    });
                     if (otherOwners.length > 3) {
                         collaboratorBadgesEl.createEl('div', {
                             cls: 'collaborator-badge',
                             text: `+${otherOwners.length - 3}`,
                             attr: { title: otherOwners.slice(3).join(', ') }
                         });
                     }
                }
            }
        });
    });
  
    // 5. 添加今日线 (在所有元素渲染后添加，确保获取正确的容器尺寸)
    // 需要 chartEl 的实际渲染宽度来正确判断是否需要 today-not-in-range 提示，这里简化处理
    addTodayLine(chartEl, timeWindow, dates, chartEl.offsetWidth);
  
  }
  
  // 将主函数暴露出去，以便在DataviewJS中调用
  // 注意：在纯JS环境（如浏览器控制台或Node.js）中测试时，可能不需要这个 return
  // 但为了在DataviewJS的 eval/Function 中获取到它，需要返回
  // 如果你的加载方式是 <script src="...">，则不需要返回，可以直接调用全局的 initializeGanttChart
  // 考虑到 DataviewJS 通常使用 fetch + eval/Function，这里返回函数
  return initializeGanttChart;
  