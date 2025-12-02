"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [libs, setLibs] = useState<any>({});
  const [openLibs, setOpenLibs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("http://127.0.0.1:8000/libraries")
      .then((res) => res.json())
      .then((data) => setLibs(data));
  }, []);

  const toggle = (key: string) => {
    setOpenLibs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside className="w-64 h-screen bg-white shadow-lg p-6 flex flex-col">
      {/*<h1 className="text-3xl font-semibold mb-8">Libatron 4000</h1>*/}
        <h1 className="text-3xl font-semibold mb-8">
    <Link
      href="/"
      className="hover:text-blue-600 transition"
    >
      T.C.LIB
    </Link>
  </h1>
      <nav className="flex flex-col gap-4">
        {Object.entries(libs).map(([key, info]: any) => {
          const hasFloors = Object.keys(info.floors).length > 0;
          const isOpen = openLibs[key] ?? false;

          return (
            <div key={key} className="flex flex-col">
              {/* Library Name */}
              {hasFloors ? (
                <button
                  onClick={() => toggle(key)}
                  className="text-left font-semibold text-lg py-2 hover:bg-blue-100 rounded-lg"
                >
                  {info.name}
                </button>
              ) : (
                <Link
                  href={`/libs/${key}`}
                  className={`font-semibold text-lg py-2 rounded-lg transition ${
                    pathname.includes(key) ? "bg-blue-300" : "hover:bg-blue-100"
                  }`}
                >
                  {info.name}
                </Link>
              )}

              {/* Floors dropdown */}
              {hasFloors && isOpen && (
                <div className="ml-4 flex flex-col gap-1">
                  {Object.entries(info.floors).map(([floorKey, floorInfo]: any) => (
                    <Link
                      key={floorKey}
                      href={`/libs/${key}/${floorKey}`}
                      className={`p-2 rounded-lg block transition ${
                        pathname.includes(`${key}/${floorKey}`)
                          ? "bg-blue-300"
                          : "hover:bg-blue-100"
                      }`}
                    >
                      {floorInfo.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
