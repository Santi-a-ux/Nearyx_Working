"use client";

import { useEffect, useState } from "react";

export default function TestEnrichmentPage() {
  const [data, setData] = useState<any>(null);
  const [enriched, setEnriched] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function test() {
      try {
        // Fetch tutors
        const tutorsRes = await fetch("/tutors/?limit=5");
        const tutorsData = await tutorsRes.json();
        const tutors = Array.isArray(tutorsData) ? tutorsData : tutorsData.tutors ?? [];

        setData({
          tutorsCount: tutors.length,
          firstTutor: tutors[0],
          tutorsKeys: tutors.length > 0 ? Object.keys(tutors[0]) : [],
        });

        // Try to enrich
        const enrichedTutors = await Promise.all(
          tutors.map(async (t: any) => {
            try {
              const profileRes = await fetch(`/api/users/profiles/${t.user_id}`);
              if (!profileRes.ok) {
                return { ...t, error: `${profileRes.status}` };
              }
              const profile = await profileRes.json();
              return {
                ...t,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
              };
            } catch (e) {
              return { ...t, error: String(e) };
            }
          })
        );

        setEnriched({
          count: enrichedTutors.length,
          first: enrichedTutors[0],
        });
      } catch (e) {
        setData({ error: String(e) });
      } finally {
        setLoading(false);
      }
    }

    test();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Enrichment Test</h1>

      <div className="mb-8 p-4 border rounded bg-gray-900">
        <h2 className="text-xl font-bold mb-2">Raw Tutors Data:</h2>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div className="p-4 border rounded bg-gray-900">
        <h2 className="text-xl font-bold mb-2">Enriched Tutors Data:</h2>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(enriched, null, 2)}
        </pre>
      </div>
    </div>
  );
}
