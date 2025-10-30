# Chart.js Visualizations Implementation

## 📊 Overview

The typing test now includes comprehensive Chart.js visualizations that provide detailed insights into typing performance through interactive charts and data visualizations.

## 🎯 Visualizations Implemented

### **1. WPM Over Time Line Chart**
- **Type**: Line chart with area fill
- **Data Source**: `resultsData.wpmOverTime`
- **Update Frequency**: Every second during test
- **Features**:
  - Smooth curve with tension
  - Area fill for visual appeal
  - Responsive design
  - Hover effects with point highlighting

### **2. Most Mistyped Characters Bar Chart**
- **Type**: Horizontal bar chart
- **Data Source**: `missedCharacters` object
- **Features**:
  - Color-coded bars (red to green gradient)
  - Top 10 most mistyped characters
  - Sorted by frequency
  - Responsive design

### **3. Slowest Keys Heatmap**
- **Type**: Grid-based heatmap with color coding
- **Data Source**: `keystrokeLog` delay analysis
- **Features**:
  - Color-coded by delay time (green/yellow/red)
  - Shows average delay per key
  - Keystroke count display
  - Hover effects with scaling

## 🔧 Technical Implementation

### **Chart.js Setup**
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);
```

### **WPM Over Time Chart Data**
```typescript
const getWPMChartData = useCallback(() => {
  if (!resultsData || !resultsData.wpmOverTime.length) {
    return { labels: [], datasets: [] };
  }

  const labels = resultsData.wpmOverTime.map((_, index) => `${index + 1}s`);
  
  return {
    labels,
    datasets: [{
      label: 'WPM Over Time',
      data: resultsData.wpmOverTime,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6
    }]
  };
}, [resultsData]);
```

### **Mistyped Characters Chart Data**
```typescript
const getMistypedChartData = useCallback(() => {
  if (!missedCharacters || Object.keys(missedCharacters).length === 0) {
    return { labels: [], datasets: [] };
  }

  const sortedChars = Object.entries(missedCharacters)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const labels = sortedChars.map(([char]) => char);
  const data = sortedChars.map(([, count]) => count);

  return {
    labels,
    datasets: [{
      label: 'Mistyped Characters',
      data,
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        // ... more colors
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(245, 101, 101)',
        'rgb(251, 146, 60)',
        'rgb(251, 191, 36)',
        'rgb(34, 197, 94)',
        // ... more colors
      ],
      borderWidth: 1
    }]
  };
}, [missedCharacters]);
```

### **Slowest Keys Data Generation**
```typescript
const getSlowestKeysData = useCallback(() => {
  if (!keystrokeLog || keystrokeLog.length < 2) {
    return [];
  }

  // Calculate delays between keystrokes
  const keyDelays: { [key: string]: number[] } = {};
  
  for (let i = 1; i < keystrokeLog.length; i++) {
    const currentKey = keystrokeLog[i].key;
    const delay = keystrokeLog[i].timestamp - keystrokeLog[i - 1].timestamp;
    
    if (!keyDelays[currentKey]) {
      keyDelays[currentKey] = [];
    }
    keyDelays[currentKey].push(delay);
  }

  // Calculate average delay for each key
  const keyAverages = Object.entries(keyDelays).map(([key, delays]) => ({
    key,
    averageDelay: delays.reduce((sum, delay) => sum + delay, 0) / delays.length,
    count: delays.length
  }));

  // Sort by average delay (slowest first) and take top 10
  return keyAverages
    .sort((a, b) => b.averageDelay - a.averageDelay)
    .slice(0, 10)
    .filter(item => item.count >= 2);
}, [keystrokeLog]);
```

## 🎨 Chart Options Configuration

### **WPM Chart Options**
```typescript
const wpmChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: 'WPM Over Time',
      color: 'rgb(107, 114, 128)',
      font: { size: 16, weight: 'bold' }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time (seconds)',
        color: 'rgb(107, 114, 128)'
      },
      grid: { color: 'rgba(156, 163, 175, 0.1)' }
    },
    y: {
      title: {
        display: true,
        text: 'Words Per Minute',
        color: 'rgb(107, 114, 128)'
      },
      grid: { color: 'rgba(156, 163, 175, 0.1)' },
      beginAtZero: true
    }
  }
};
```

### **Mistyped Chart Options**
```typescript
const mistypedChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: 'Most Mistyped Characters',
      color: 'rgb(107, 114, 128)',
      font: { size: 16, weight: 'bold' }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Characters',
        color: 'rgb(107, 114, 128)'
      },
      grid: { color: 'rgba(156, 163, 175, 0.1)' }
    },
    y: {
      title: {
        display: true,
        text: 'Number of Mistakes',
        color: 'rgb(107, 114, 128)'
      },
      grid: { color: 'rgba(156, 163, 175, 0.1)' },
      beginAtZero: true
    }
  }
};
```

## 🎨 Slowest Keys Heatmap Styling

### **Color Coding Logic**
```typescript
const delayColor = item.averageDelay > 1 ? 'bg-red-100 text-red-800' :
                  item.averageDelay > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800';
```

### **Heatmap Grid Layout**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {getSlowestKeysData().map((item, index) => (
    <div 
      key={item.key}
      className={`p-3 rounded-lg border ${delayColor} transition-all duration-200 hover:scale-105`}
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-lg font-bold">{item.key}</span>
        <span className="text-sm font-semibold">{item.averageDelay.toFixed(3)}s</span>
      </div>
      <div className="text-xs text-gray-600 mt-1">
        {item.count} keystrokes
      </div>
    </div>
  ))}
</div>
```

## 📊 Data Flow

### **1. WPM Over Time**
1. **Test runs** → WPM calculated every second
2. **Data stored** → `resultsData.wpmOverTime` array
3. **Chart renders** → Line chart with time labels
4. **Real-time updates** → Chart updates during test

### **2. Mistyped Characters**
1. **User types** → Mistakes tracked in `missedCharacters`
2. **Test ends** → Data sorted by frequency
3. **Chart renders** → Bar chart with top 10 characters
4. **Color coding** → Red for most mistakes, green for least

### **3. Slowest Keys**
1. **Keystrokes logged** → Timestamps captured
2. **Delays calculated** → Time between keystrokes
3. **Averages computed** → Per-key average delays
4. **Heatmap renders** → Color-coded grid display

## 🎯 Features

### **WPM Over Time Chart**
- ✅ **Real-time updates** during test
- ✅ **Smooth line curve** with tension
- ✅ **Area fill** for visual appeal
- ✅ **Responsive design** adapts to screen size
- ✅ **Hover effects** with point highlighting
- ✅ **Clear axis labels** with units

### **Mistyped Characters Chart**
- ✅ **Color-coded bars** (red to green gradient)
- ✅ **Top 10 display** most common mistakes
- ✅ **Sorted by frequency** highest to lowest
- ✅ **Responsive design** adapts to screen size
- ✅ **Clear labels** with character display

### **Slowest Keys Heatmap**
- ✅ **Color coding** by delay time
  - 🟢 Green: < 0.5s (fast)
  - 🟡 Yellow: 0.5-1s (moderate)
  - 🔴 Red: > 1s (slow)
- ✅ **Grid layout** responsive design
- ✅ **Hover effects** with scaling
- ✅ **Keystroke count** display
- ✅ **Average delay** precision to 3 decimal places

## 🧪 Testing Results

### **Chart Data Generation Test**
```
=== WPM CHART DATA ===
Labels: ['1s', '2s', '3s', '4s', '5s', ...]
Data points: [20, 25, 30, 35, 40, 45, ...]
Dataset config: { borderColor, backgroundColor, borderWidth, fill, tension }

=== MISTYPED CHARACTERS CHART DATA ===
Labels: ['b', 'd', 'x', 'g', 'y']
Data: [3, 2, 2, 1, 1]
Colors: [red, orange, yellow, green, blue]

=== SLOWEST KEYS DATA ===
Slowest keys:
1. "b": 1.000s (2 keystrokes)

=== COLOR CODING TEST ===
"b": 1.000s → YELLOW

✅ All chart data generation logic working correctly!
```

## 🚀 Benefits

### **For Users**
- **Visual feedback** on typing performance
- **Pattern recognition** of common mistakes
- **Progress tracking** through WPM progression
- **Actionable insights** for improvement

### **For Learning**
- **Identify problem areas** through visual data
- **Track improvement** over time
- **Focus practice** on specific characters
- **Understand typing rhythm** through delay analysis

### **For Analysis**
- **Comprehensive data** visualization
- **Interactive charts** for exploration
- **Color-coded insights** for quick understanding
- **Responsive design** for all devices

## 📦 Dependencies

- **chart.js**: Core charting library
- **react-chartjs-2**: React wrapper for Chart.js
- **Tailwind CSS**: Styling and responsive design

**The Chart.js visualizations provide comprehensive, interactive data visualization that helps users understand their typing performance patterns and identify areas for improvement.** 
_Last updated: 2025-10-30_
