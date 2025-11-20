"use client";

interface Props {
  name: string;
  avg: number;
  level: string;
  time: string;
}

export default function LibraryCard({ name, avg, level, time }: Props) {
  // Color coding based on noise level
  const bgColor =
    level.includes("Silence") ? "bg-green-100" :
    level.includes("Whisper") ? "bg-yellow-100" :
    level.includes("Chatty") ? "bg-orange-200" :
    "bg-red-200";

  const textColor =
    level.includes("Silence") ? "text-green-900" :
    level.includes("Whisper") ? "text-yellow-900" :
    level.includes("Chatty") ? "text-orange-900" :
    "text-red-900";

  return (
    <div className={`p-5 rounded-2xl shadow-lg ${bgColor} transition hover:shadow-xl`}>
      <h2 className="text-xl font-semibold mb-2 capitalize">{name}</h2>

      <p className="text-lg font-medium">
        Noise: <span className="font-bold">{avg} dBFS</span>
      </p>

      <p className={`text-md font-semibold mt-1 ${textColor}`}>
        {level}
      </p>

      <p className="text-sm text-gray-600 mt-3">
        Updated: {time}
      </p>
    </div>
  );
}
