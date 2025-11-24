"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/app/firebaseConfig";

interface Reading {
  avg_noise_db: number;
  noise_level: string;
  created_at: string;
}

export default function LibraryClientPage({
  library,
  floor,
}: {
  library: string;
  floor?: string;
}) {
  const [lastReading, setLastReading] = useState<Reading | null>(null);

  useEffect(() => {
    // 🔥 1. Build Firebase path based on whether the library has floors
    const path = floor
      ? `libraries/${library}/${floor}/readings`
      : `libraries/${library}/readings`;

    // Reference to the Firebase DB path
    const dbRef = ref(database, path);

    // 🔥 2. Subscribe to live updates from Firebase
    onValue(dbRef, (snapshot) => {
      const readings = snapshot.val();

      // If data exists...
      if (readings) {
        const list = Object.values(readings) as Reading[];
        // 🔥 3. Store the *latest* reading
        setLastReading(list[list.length - 1]);
      }
    });
  }, [library, floor]); // Re-run fetch when library or floor changes

  return (
    <div>
      {/* 🔥 4. Page title */}
      <h1 className="text-3xl font-bold mb-6 capitalize">
        {floor ? `${library} / Floor ${floor}` : library}
      </h1>

      {/* 🔥 5. Show reading if available */}
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
