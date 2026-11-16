import type { CSSProperties } from "react";
import type { TeamSummary } from "../lib/game-summary.ts";

type MarkStyle = CSSProperties & Record<"--mark-main" | "--mark-second", string>;

type Props = {
  readonly team: TeamSummary;
  /** `large` beside a page title, `regular` everywhere else. */
  readonly size?: "regular" | "large";
};

/**
 * The dot of a team's two colours. Decorative: the name always stands beside it, so nothing is
 * told by colour alone.
 */
export function TeamMark({ team, size = "regular" }: Props) {
  const [main, second] = team.colors;
  // The colours are data. How the two share the dot is in the stylesheet.
  const style: MarkStyle = { "--mark-main": main, "--mark-second": second };
  return (
    <span
      className={size === "large" ? "team-mark team-mark--large" : "team-mark"}
      style={style}
      aria-hidden="true"
    />
  );
}

/** A team as the site writes it everywhere: its mark, then its name. */
export function TeamLabel({ team, size = "regular" }: Props) {
  return (
    <span className="team">
      <TeamMark team={team} size={size} />
      <span className="team__name">{team.name}</span>
    </span>
  );
}
