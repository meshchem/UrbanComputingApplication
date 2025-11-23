"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/app/firebaseConfig";

interface Reading {
  avg_noise_db: number;
  noise_level: string;
  created_at: string;
}

export default function LibraryClientPage({ name }: { name: string }) {
  const [lastReading, setLastReading] = useState<Reading | null>(null);

  useEffect(() => {
    const dbRef = ref(database, `libraries/${name}/readings`);
    onValue(dbRef, (snapshot) => {
      const readings = snapshot.val();
      if (readings) {
        const list = Object.values(readings) as Reading[];
        setLastReading(list[list.length - 1]);
      }
    });
  }, [name]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 capitalize">
        {name.replace("_", " ")}
      </h1>

      {lastReading ? (
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-lg">
          <p className="text-2xl font-semibold">
            Noise: {lastReading.avg_noise_db} dBFS
          </p>
          <p className="text-lg mt-2">{lastReading.noise_level}</p>
          <p className="text-sm text-gray-600 mt-4">
            Updated: {new Date(lastReading.created_at).toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-500">Loading...</p>
      )}
    </div>
  );
}
