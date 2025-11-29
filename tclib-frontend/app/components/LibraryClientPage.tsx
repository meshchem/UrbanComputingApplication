"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "@/app/firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


interface Reading {
  avg_noise_db: number;
  noise_level: string;
  created_at: string;
}

// interface MetaFloor {
//   name: string;
//   resources: Record<string, number>;
//   capacity: number;
// }

export default function LibraryClientPage({
  library,
  floor,
}: {
  library: string;
  floor?: string;
}) {
  const [lastReading, setLastReading] = useState<Reading | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [capacityLevel, setCapacityLevel] = useState<string>("empty");
  const [readingHistory, setReadingHistory] = useState<Reading[]>([]);

  // Load metadata from backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/libraries")
      .then((res) => res.json())
      .then((all) => {
        const libData = all[library];
        setMeta(floor ? libData.floors[floor] : libData);
      });
  }, [library, floor]);

  // Load noise readings from Firebase
  useEffect(() => {
    const path = floor
      ? `libraries/${library}/${floor}/readings`
      : `libraries/${library}/readings`;

    const dbRef = ref(database, path);

    onValue(dbRef, (snapshot) => {
      const readings = snapshot.val();
      if (readings) {
        const list = Object.values(readings) as Reading[];
        setLastReading(list[list.length - 1]);
        // Save full history (or last 30)
        setReadingHistory(list.slice(-30));
      }
    });
  }, [library, floor]);

  const boxColour =
  lastReading?.noise_level?.includes("Quiet")
    ? "bg-green-100"
    : lastReading?.noise_level?.includes("Medium")
    ? "bg-yellow-100"
    : lastReading?.noise_level?.includes("Loud")
    ? "bg-orange-200"
    : "bg-gray-200";

  // Load / Save capacity level
  useEffect(() => {
    const capacityRef = ref(
      database,
      floor
        ? `libraries/${library}/${floor}/capacity`
        : `libraries/${library}/capacity`
    );

    onValue(capacityRef, (snapshot) => {
      if (snapshot.val()) setCapacityLevel(snapshot.val());
    });
  }, [library, floor]);

  const setCapacity = (level: string) => {
    const path = floor
      ? `libraries/${library}/${floor}/capacity`
      : `libraries/${library}/capacity`;

    set(ref(database, path), level);
    setCapacityLevel(level);
  };

  const capacityColour =
    capacityLevel?.includes("Empty")
    ? "bg-green-100"
    : capacityLevel?.includes("Low")
    ? "bg-yellow-100"
    : capacityLevel?.includes("Medium")
    ? "bg-orange-200"
    : capacityLevel?.includes("Almost Full")
    ? "bg-red-200"
    : "bg-red-400";


  const today = new Date().toDateString();
  const chartData = readingHistory
  .filter((item) => {
    const itemDate = new Date(item.created_at).toDateString();
    return itemDate === today;
  })
  .map((item) => ({
    time: new Date(item.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    avg_noise_db: item.avg_noise_db,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold capitalize">
        {floor ? `${library} / Floor ${floor}` : library}
      </h1>

      {/* --- Noise Reading --- */}
      {lastReading ? (
        <div className={`p-6 rounded-2xl shadow-lg ${boxColour} max-w-3xl`}>
            <p className="text-2xl font-semibold">
            Noise: {lastReading.avg_noise_db} dBFS
            </p>
            <p className="text-lg mt-2">{lastReading.noise_level}</p>
            <p className="text-sm text-gray-600 mt-4">
            Last Updated: {new Date(lastReading.created_at).toLocaleString()}
            </p>
            <p>

            </p>
            <p>
                <LineChart
              width={700}
              height={300}
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avg_noise_db"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
            </p>
        </div>
      ) : (
        <p className="text-gray-500">Loading noise data...</p>
      )}

      {/* --- Resources Section --- */}
      {meta && (
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-lg">
          <h2 className="text-xl font-semibold mb-3">Resources</h2>
          {Object.keys(meta.resources).length === 0 ? (
            <p className="text-gray-500">No listed resources</p>
          ) : (
            <ul className="list-disc ml-5">
              {Object.entries(meta.resources).map(([res, count]) => (
                <li key={res} className="capitalize">
                  {res}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* --- Capacity Selector --- */}
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-lg">
        <h2 className="text-xl font-semibold mb-3">Capacity</h2>

        <div className="flex gap-3">
          {["Empty", "Low", "Medium", "Almost Full", "No Seats"].map((level) => (
            <button
              key={level}
              onClick={() => setCapacity(level)}
              className={`px-3 py-2 rounded-lg border ${
                capacityLevel === level ? capacityColour : "bg-gray-100"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
