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
    const [lastCapacityUpdate, setLastCapacityUpdate] = useState<string | null>(null);
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

    // Load capacity + lastUpdated
    useEffect(() => {
        const capLevelRef = ref(database, `${basePath}/capacity/level`);
        const capTimeRef = ref(database, `${basePath}/capacity/lastUpdated`);

        onValue(capLevelRef, (snapshot) => {
            const value = snapshot.val();
            if (value) setCapacityLevel(value);
        });

        onValue(capTimeRef, (snapshot) => {
            const value = snapshot.val();
            if (value) setLastCapacityUpdate(value);
        });
    }, [library, floor]);


    const setCapacity = (level: string) => {
        const timestamp = new Date().toISOString();
        set(ref(database, `${basePath}/capacity/level`), level);
        set(ref(database, `${basePath}/capacity/lastUpdated`), timestamp);

        setCapacityLevel(level);
        setLastCapacityUpdate(timestamp);
    };


    // Colour for noise box based on noise level
    const boxColour =
        lastReading?.noise_level?.includes("Quiet")
            ? "bg-green-200"
            : lastReading?.noise_level?.includes("Medium")
                ? "bg-yellow-200"
                : lastReading?.noise_level?.includes("Loud")
                    ? "bg-orange-200"
                    : "bg-gray-200";

    // Colour for capacity box based on capacity level
    const capacityColour =
        capacityLevel.includes("Empty")
            ? "bg-emerald-300"
            : capacityLevel.includes("Low")
                ? "bg-lime-300"
                : capacityLevel.includes("Medium")
                    ? "bg-amber-300"
                    : capacityLevel.includes("Almost Full")
                        ? "bg-orange-300"
                        : "bg-red-400";


    const chartData = readingHistory
        .filter((r) => new Date(r.created_at).toDateString() === today)
        .map((r) => ({
            time: new Date(r.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }),
            avg_noise_db: r.avg_noise_db,
            noise_level: r.noise_level,
            color: r.noise_level.includes("Quiet")
                ? "#16a34a"      // green
                : r.noise_level.includes("Medium")
                    ? "#f59e0b"      // yellow
                    : r.noise_level.includes("Loud")
                        ? "#ea580c"      // orange
                        : "#6b7280",     // gray
        }));


    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold capitalize">
                {floor ? `${library} ${floor}` : library}
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
                                    capacityLevel === level ? capacityColour : "bg-sky-50"
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <h4 className="text-sm leading-[3] text-gray-600">
                        {lastCapacityUpdate && (
                            <div>
                                Updated {new Date(lastCapacityUpdate).toLocaleString()}
                            </div>
                        )}
                    </h4>
                </div>

                {/* Opening Hours */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-3">Opening Hours</h2>
                    <p className="text-5xl font-medium text-center leading-[1.5]">{todayHours ? todayHours : "Closed"}</p>
                </div>
            </div>


            <div className="flex flex-col md:flex-row gap-6">

                {/*--- Noise Levels --- */}
                {lastReading ? (
                    <div className={`p-6 rounded-2xl shadow-lg max-w-3xl ${boxColour}`}>
                        <p className="text-2xl font-semibold">{lastReading.noise_level}</p>
                        <p className="text-lg leading-[1.5]">{lastReading.avg_noise_db} dBFS</p>
                        <p className="text-sm leading-[1.5] text-gray-600">
                            Updated {new Date(lastReading.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm leading-[1.5] text-gray-600"></p>
                        <LineChart
                            width={700}
                            height={300}
                            data={chartData}
                            margin={{
                                top: 0,
                                right: 0,
                                bottom: 20,
                                left: 20,
                            }}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis
                                dataKey="time"
                                label={{value: "Time", position: "insideBottom", offset: -10}}
                            />
                            <YAxis
                                label={{value: "dBFS", angle: 90, position: "insideLeft"}}
                            />
                            <Tooltip
                                formatter={(value, name, props) => {
                                    const {payload} = props;
                                    return [
                                        `${value} dBFS (${payload.noise_level})`, // main row
                                        "Noise" // label name
                                    ];
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="avg_noise_db"
                                stroke="#8884d8"
                                strokeWidth={3}
                                //activeDot={{r: 8}}
                                activeDot={{r: 6}}
                                dot={({cx, cy, payload}) => (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={4}
                                        fill={payload.color}
                                        stroke="black"
                                        strokeWidth={1}
                                    />
                                )}
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
