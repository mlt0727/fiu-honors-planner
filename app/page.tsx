import Planner from '@/components/Planner';
import items from '@/data/items.json';
import events from '@/data/events.json';
import type {Item,Event} from '@/lib/types';
export default function Home(){return <Planner items={items as Item[]} seedEvents={events as Event[]}/>;}
