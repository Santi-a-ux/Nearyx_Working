"use client";

import { Suspense } from "react";

import { ExpertOnboardingDialog } from "@/components/profile/expert-onboarding-dialog";

function ExpertOnboardingDialogWithParams(props: { triggerLabel?: string; triggerClassName?: string }) {
  return <ExpertOnboardingDialog {...props} />;
}

export function ProfileExpertActions({
  triggerLabel = "Crear perfil de experto",
  triggerClassName,
}: {
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  return (
    <Suspense fallback={null}>
      <ExpertOnboardingDialogWithParams triggerLabel={triggerLabel} triggerClassName={triggerClassName} />
    </Suspense>
  );
}
