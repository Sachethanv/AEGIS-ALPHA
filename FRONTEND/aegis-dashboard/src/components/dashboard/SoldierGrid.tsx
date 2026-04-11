import type { Soldier } from '../../data/soldiers';
import { SoldierCard } from './SoldierCard';

interface Props {
  soldiers: Soldier[];
  onShowMap: (s: Soldier) => void;
}

export function SoldierGrid({ soldiers, onShowMap }: Props) {
  // Sort: WOUNDED first, then CRITICAL, then ELEVATED, then NOMINAL
  const sorted = [...soldiers].sort((a, b) => {
    const order = { WOUNDED: 0, CRITICAL: 1, ELEVATED: 2, NOMINAL: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 px-6 pb-10">
      {sorted.map(soldier => (
        <SoldierCard
          key={soldier.id}
          soldier={soldier}
          onShowMap={onShowMap}
        />
      ))}
    </div>
  );
}
