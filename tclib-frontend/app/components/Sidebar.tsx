"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const libraries = ["ussher_1", "ussher_2", "ussher_3"];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white shadow-lg p-6 flex flex-col">
      <h1 className="text-3xl font-semibold mb-8">T.C.Lib</h1>

      <nav className="flex flex-col gap-3">
        {libraries.map((lib) => {
          const active = pathname.includes(lib);

          return (
            <Link
              key={lib}
              href={`/libs/${lib}`}
              className={`p-3 rounded-lg text-lg capitalize transition
                ${active ? "bg-blue-300" : "hover:bg-blue-100"}
              `}
            >
              {lib.replace("_", " ")}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
