"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ApplyForm } from "@/components/forms/ApplyForm";

export function ApplyPanel({ projectName, roles }: { projectName: string; roles: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)} arrow>
        Apply to project
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={projectName} eyebrow="Apply to project" wide>
        <ApplyForm projectName={projectName} roles={roles} />
      </Modal>
    </>
  );
}
