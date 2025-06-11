"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { name: "Jun 1", events: 45 },
  { name: "Jun 2", events: 52 },
  { name: "Jun 3", events: 38 },
  { name: "Jun 4", events: 67 },
  { name: "Jun 5", events: 89 },
  { name: "Jun 6", events: 76 },
  { name: "Jun 7", events: 94 },
  { name: "Jun 8", events: 82 },
  { name: "Jun 9", events: 71 },
  { name: "Jun 10", events: 95 },
]

export function EventOverview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Line type="monotone" dataKey="events" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
