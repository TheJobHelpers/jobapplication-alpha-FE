import { ComingSoon } from "@/components/admin/coming-soon";

export default function PipelinePage() {
  return (
    <ComingSoon
      area="Pipeline"
      title="Application pipeline"
      blurb="Two lenses: By client (all active applications by stage) and, for managers and admins, By team member (each member's client load, quota fill, and progress)."
    />
  );
}
