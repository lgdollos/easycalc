import "katex/dist/katex.min.css";
import "./twin-plots.css";
import { buildTwinPlotsInteractive } from "./interactive";
import { renderMathIn } from "../ui/renderMath";

function buildApp(root: HTMLElement) {
  root.className = "tp-root";

  root.innerHTML = `
    <header class="tp-header">
      <p class="tp-kicker">Calculus Made Easy — Chapter X</p>
      <h1 class="tp-title">(3) A slightly harder case</h1>
    </header>

    <article class="tp-prose">
      <p>Now for a slightly harder case:</p>
      <p class="math-display">y = ax^2 + b.</p>

      <p>
        Again the curve will start on the <span class="math">y</span>-axis at a height
        <span class="math">b</span> above the origin.
      </p>

      <p>Now differentiate:</p>
      <p class="math-display">\\frac{dy}{dx} = 2ax.</p>

      <p>
        This shows that the steepness will not be constant: it increases as
        <span class="math">x</span> increases. At the starting point <span class="math">P</span>,
        where <span class="math">x = 0</span>, the curve has no steepness; that is, it is level.
        On the left of the origin, where <span class="math">x</span> has negative values,
        <span class="math">\\dfrac{dy}{dx}</span> will also have negative values, or will descend
        from left to right, as in the Figure.
      </p>

      <p>Let us illustrate this by working out a particular instance. Taking the equation</p>
      <p class="math-display">y = \\tfrac{1}{4}x^2 + 3,</p>
      <p>and differentiating it, we get</p>
      <p class="math-display">\\dfrac{dy}{dx} = \\tfrac{1}{2}x.</p>

      <p>
        Now assign a few successive values, say from <span class="math">0</span> to
        <span class="math">5</span>, to <span class="math">x</span>; and calculate the corresponding
        values of <span class="math">y</span> by the first equation; and of
        <span class="math">\\dfrac{dy}{dx}</span> from the second equation. Tabulating results, we have:
      </p>

      <div class="tp-interactive-slot"></div>

      <p>
        If a curve comes to a sudden cusp, as in Figure 25, the slope at that point suddenly
        changes from a slope upward to a slope downward. In that case
        <span class="math">\\dfrac{dy}{dx}</span> will clearly undergo an abrupt change from a
        positive to a negative value.
      </p>

      <p>
        The following examples show further applications of the principles just explained.
      </p>
    </article>

    <footer class="tp-footer">
      <p>
        Source:
        <a href="https://calculusmadeeasy.org/10.html" rel="noopener noreferrer">calculusmadeeasy.org/10.html</a>
        · <a href="../index.html">Chapter comic</a>
        · <a href="./slope-morph.html">Slope morph</a>
      </p>
    </footer>
  `;

  renderMathIn(root);
  root.querySelector(".tp-interactive-slot")!.replaceWith(buildTwinPlotsInteractive());
}

const mount = document.querySelector<HTMLElement>("#twin-plots-app");
if (mount) buildApp(mount);
