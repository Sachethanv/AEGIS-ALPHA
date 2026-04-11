import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import type { SoldierStatus } from '../../data/soldiers';

interface Props {
  data: number[];
  status: SoldierStatus;
}

const CHART_COLORS = {
  NOMINAL:  '#00e87a',
  ELEVATED: '#f5c518',
  CRITICAL: '#ff8800',
  WOUNDED:  '#ff3c3c',
};

export function PulseChart({ data, status }: Props) {
  const color = CHART_COLORS[status];
  const chartData = data.map((bpm, i) => ({ i, bpm }));

  return (
    <div className="w-full h-11">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
          <Area
            type="monotone"
            dataKey="bpm"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${status})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
