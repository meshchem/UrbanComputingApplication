"use client";

import {useEffect, useState} from "react";
import {ref, onValue, set} from "firebase/database";
import {database} from "@/app/firebaseConfig";
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip} from "recharts";

interface Reading {
    avg_noise_db: number;
    noise_level: string;
    created_at: string;
}

export default function LibraryClientPage({library, floor,}: {
    library: string;
    floor?: string;
}) {
    const [lastReading, setLastReading] = useState<Reading | null>(null);
    const [readingHistory, setReadingHistory] = useState<Reading[]>([]);
    const [capacityLevel, setCapacityLevel] = useState<string>("Empty");
    const [resources, setResources] = useState<any>({});
    const [openingHours, setOpeningHours] = useState<any>({});
    const [todayHours, setTodayHours] = useState<string | null>(null);

    const today = new Date().toDateString();
    const day_of_week = new Date()
        .toLocaleString("en-US", {weekday: "long"})
        .toLowerCase();


    // Paths for libraries (with/out floors)
    const basePath = floor
        ? `libraries/${library}/${floor}` // libraries/ussher/1
        : `libraries/${library}`;         // libraries/postgrad

    // Load noise readings
    useEffect(() => {
        const readingsRef = ref(database, `${basePath}/readings`);

        onValue(readingsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const list = Object.values(data) as Reading[];
            setLastReading(list[list.length - 1]);
            setReadingHistory(list.slice(-100)); // last 40 readings
        });
    }, [library, floor]);

    // Load opening hours
    useEffect(() => {
        const hoursRef = ref(database, `libraries/${library}/opening_hours`);

        const unsub = onValue(hoursRef, (snapshot) => {
            const data = snapshot.val() || {};
            setOpeningHours(data);

            // Match today's day to Firebase key
            if (data[day_of_week]) {
                setTodayHours(data[day_of_week]);
            } else {
                setTodayHours("Closed");
            }
        });

        return () => unsub();
    }, [library, day_of_week]);

    // Load resources
    useEffect(() => {
        const resRef = ref(database, `${basePath}/resources`);
        onValue(resRef, (snapshot) => setResources(snapshot.val() || {}));
    }, [library, floor]);

    // Load capacity
    useEffect(() => {
        const capRef = ref(database, `${basePath}/capacity`);
        onValue(capRef, (snapshot) => {
            if (snapshot.val()) setCapacityLevel(snapshot.val());
        });
    }, [library, floor]);

    const setCapacity = (level: string) => {
        set(ref(database, `${basePath}/capacity`), level);
        setCapacityLevel(level);
    };


    // Color for noise box based on noise level
    const boxColour =
        lastReading?.noise_level?.includes("Quiet")
            ? "bg-green-200"
            : lastReading?.noise_level?.includes("Medium")
                ? "bg-yellow-200"
                : lastReading?.noise_level?.includes("Loud")
                    ? "bg-orange-200"
                    : "bg-gray-200";

    // Color for capacity box based on capacity level
    const capacityColour =
        capacityLevel.includes("Empty")
            ? "bg-green-200"
            : capacityLevel.includes("Low")
                ? "bg-yellow-200"
                : capacityLevel.includes("Medium")
                    ? "bg-orange-200"
                    : capacityLevel.includes("Almost Full")
                        ? "bg-red-300"
                        : "bg-red-400";


    // Graph (current_day only)
    const chartData = readingHistory
        .filter((r) => new Date(r.created_at).toDateString() === today)
        .map((r) => ({
            time: new Date(r.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            avg_noise_db: r.avg_noise_db,
        }));

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold capitalize">
                {floor ? `${library} / ${floor}` : library}
            </h1>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Capacity */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-3">Capacity</h2>
                    <div className="flex flex-wrap gap-3">
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

                {/* Opening Hours */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-3">Opening Hours</h2>
                    <p className="text-gray-700">{todayHours ? todayHours : "Closed"}</p>
                </div>
            </div>


            <div className="flex flex-col md:flex-row gap-6">

                {/* --- Noise Section --- */}
                {lastReading ? (
                    <div className={`p-6 rounded-2xl shadow-lg max-w-3xl ${boxColour}`}>
                        <p className="text-2xl font-semibold">{lastReading.noise_level}</p>
                        <p className="text-lg">{lastReading.avg_noise_db} dBFS</p>
                        <p className="text-sm text-gray-600">
                            Updated {new Date(lastReading.created_at).toLocaleString()}
                        </p>

                        <LineChart width={700} height={300} data={chartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="time"/>
                            <YAxis
                                label={{value: "dBFS", angle: -90, position: "insideLeft"}}
                            />
                            <Tooltip/>
                            <Line
                                type="monotone"
                                dataKey="avg_noise_db"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </div>
                ) : (
                    <p className="text-gray-500">Loading noise data…</p>
                )}

                {/* --- Resources --- */}
                <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/4">
                    <h2 className="text-xl font-semibold mb-3">Resources</h2>
                    {Object.keys(resources).length === 0 ? (
                        <p className="text-gray-500">No resources listed</p>
                    ) : (
                        <ul className="list-disc ml-5">
                            {Object.entries(resources).map(([name, qty]) => (
                                <li key={name}>
                                    {name}: {qty as number}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );

}
