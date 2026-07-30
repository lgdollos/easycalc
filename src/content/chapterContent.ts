export const CHAPTER_BRIDGE_HTML = String.raw`
  <section class="chapter-section">
    <p>We have seen that the short expression “the slope of a curve” has no precise meaning, because a curve has so many slopes; in fact, every small portion of a curve has a different slope. “The slope of a curve at a point” is, however, a perfectly defined thing; it is the slope of a very small portion of the curve situated just at that point; and we have seen that this is the same as “the slope of the tangent to the curve at that point.”</p>

    <p>Observe that <span class="math">dx</span> is a short step to the right, and <span class="math">dy</span> the corresponding short step upwards. These steps must be considered as short as possible; in fact indefinitely short, though in diagrams we have to represent them by bits that are not infinitesimally small, otherwise they could not be seen.</p>

    <p>We shall hereafter make considerable use of this circumstance that <span class="math">\dfrac{dy}{dx}</span> represents the slope of the curve at any point.</p>
  </section>
`;

export const CHAPTER_REMAINDER_HTML = String.raw`
  <section class="chapter-section">
    <p>If the “curve” happens to be a straight line, like that in Figure 12, the value of <span class="math">\dfrac{dy}{dx}</span> will be the same at all points along it. In other words its slope is constant.</p>
    <div class="static-fig-slot" data-fig="12"></div>

    <p>If a curve is one that turns more upwards as it goes along to the right, the values of <span class="math">\dfrac{dy}{dx}</span> will become greater and greater with the increasing steepness, as in Figure 13.</p>
    <div class="static-fig-slot" data-fig="13"></div>

    <p>If a curve is one that gets flatter and flatter as it goes along, the values of <span class="math">\dfrac{dy}{dx}</span> will become smaller and smaller as the flatter part is reached, as in Figure 14.</p>
    <div class="static-fig-slot" data-fig="14"></div>

    <p>If a curve first descends, and then goes up again, as in Figure 15, presenting a concavity upwards, then clearly <span class="math">\dfrac{dy}{dx}</span> will first be negative, with diminishing values as the curve flattens, then will be zero at the point where the bottom of the trough of the curve is reached; and from this point onward <span class="math">\dfrac{dy}{dx}</span> will have positive values that go on increasing. In such a case <span class="math">y</span> is said to pass by a minimum. The minimum value of <span class="math">y</span> is not necessarily the smallest value of <span class="math">y</span>, it is that value of <span class="math">y</span> corresponding to the bottom of the trough; for instance, in Figure 28 the value of <span class="math">y</span> corresponding to the bottom of the trough is <span class="math">1</span>, while <span class="math">y</span> takes elsewhere values which are smaller than this. The characteristic of a minimum is that <span class="math">y</span> must increase on either side of it.</p>
    <div class="static-fig-slot" data-fig="15"></div>
    <div class="static-fig-slot" data-fig="28"></div>

    <p class="chapter-note">Note: For the particular value of <span class="math">x</span> that makes <span class="math">y</span> a minimum, the value of <span class="math">\dfrac{dy}{dx} = 0</span>.</p>

    <p>If a curve first ascends and then descends, the values of <span class="math">\dfrac{dy}{dx}</span> will be positive at first; then zero, as the summit is reached; then negative, as the curve slopes downwards, as in Figure 16. In this case <span class="math">y</span> is said to pass by a maximum, but the maximum value of <span class="math">y</span> is not necessarily the greatest value of <span class="math">y</span>. In Figure 28, the maximum of <span class="math">y</span> is <span class="math">2\frac{1}{3}</span>, but this is by no means the greatest value <span class="math">y</span> can have at some other point of the curve.</p>
    <div class="static-fig-slot" data-fig="16"></div>

    <p class="chapter-note">Note: For the particular value of <span class="math">x</span> that makes <span class="math">y</span> a maximum, the value of <span class="math">\dfrac{dy}{dx}= 0</span>.</p>

    <p>If a curve has the peculiar form of Figure 17, the values of <span class="math">\dfrac{dy}{dx}</span> will always be positive; but there will be one particular place where the slope is least steep, where the value of <span class="math">\dfrac{dy}{dx}</span> will be a minimum; that is, less than it is at any other part of the curve.</p>
    <div class="static-fig-slot" data-fig="17"></div>

    <p>If a curve has the form of Figure 18, the value of <span class="math">\dfrac{dy}{dx}</span> will be negative in the upper part, and positive in the lower part; while at the nose of the curve where it becomes actually perpendicular, the value of <span class="math">\dfrac{dy}{dx}</span> will be infinitely great.</p>
    <div class="static-fig-slot" data-fig="18"></div>

    <p>Now that we understand that <span class="math">\dfrac{dy}{dx}</span> measures the steepness of a curve at any point, let us turn to some of the equations which we have already learned how to differentiate.</p>
  </section>

  <section class="chapter-section">
    <h2>(1) The simplest case</h2>
    <p>As the simplest case take this:</p>
    <p class="math-display">y=x+b.</p>

    <p>It is plotted out in Figure 19, using equal scales for <span class="math">x</span> and <span class="math">y</span>. If we put <span class="math">x = 0</span>, then the corresponding ordinate will be <span class="math">y = b</span>; that is to say, the “curve” crosses the <span class="math">y</span>-axis at the height <span class="math">b</span>. From here it ascends at <span class="math">45°</span>; for whatever values we give to <span class="math">x</span> to the right, we have an equal <span class="math">y</span> to ascend. The line has a gradient of <span class="math">1</span> in <span class="math">1</span>.</p>
    <div class="static-fig-slot" data-fig="19"></div>

    <p>Now differentiate <span class="math">y = x+b</span>, by the rules we have already learned, and we get <span class="math">\dfrac{dy}{dx} = 1</span>.</p>

    <p>The slope of the line is such that for every little step <span class="math">dx</span> to the right, we go an equal little step <span class="math">dy</span> upward. And this slope is constant; always the same slope.</p>
  </section>

  <section class="chapter-section">
    <h2>(2) Another straight line</h2>
    <p>Take another case:</p>
    <p class="math-display">y = ax+b.</p>

    <p>We know that this curve, like the preceding one, will start from a height <span class="math">b</span> on the <span class="math">y</span>-axis. But before we draw the curve, let us find its slope by differentiating; which gives <span class="math">\dfrac{dy}{dx} = a</span>. The slope will be constant, at an angle, the tangent of which is here called <span class="math">a</span>. Let us assign to <span class="math">a</span> some numerical value; say <span class="math">\frac{1}{3}</span>. Then we must give it such a slope that it ascends <span class="math">1</span> in <span class="math">3</span>; or <span class="math">dx</span> will be <span class="math">3</span> times as great as <span class="math">dy</span>; as magnified in Figure 21. So, draw the line in Figure 20 at this slope.</p>
    <div class="static-fig-pair">
      <div class="static-fig-slot" data-fig="20"></div>
      <div class="static-fig-slot" data-fig="21"></div>
    </div>
  </section>

  <section class="chapter-section">
    <h2>(3) A slightly harder case</h2>
    <p>Now for a slightly harder case:</p>
    <p class="math-display">y = ax^2 + b.</p>

    <p>Again the curve will start on the <span class="math">y</span>-axis at a height <span class="math">b</span> above the origin.</p>

    <p>Now differentiate:</p>
    <p class="math-display">\frac{dy}{dx} = 2ax.</p>

    <p>This shows that the steepness will not be constant: it increases as <span class="math">x</span> increases. At the starting point <span class="math">P</span>, where <span class="math">x = 0</span>, the curve (Figure 22) has no steepness; that is, it is level. On the left of the origin, where <span class="math">x</span> has negative values, <span class="math">\dfrac{dy}{dx}</span> will also have negative values, or will descend from left to right, as in Figure 22.</p>
    <div class="static-fig-slot" data-fig="22"></div>

    <p>Let us illustrate this by working out a particular instance. Taking the equation</p>
    <p class="math-display">y = \tfrac{1}{4}x^2 + 3,</p>
    <p>and differentiating it, we get</p>
    <p class="math-display">\dfrac{dy}{dx} = \tfrac{1}{2}x.</p>

    <p>Now assign a few successive values, say from <span class="math">0</span> to <span class="math">5</span>, to <span class="math">x</span>; and calculate the corresponding values of <span class="math">y</span> by the first equation; and of <span class="math">\dfrac{dy}{dx}</span> from the second equation. Tabulating results, we have:</p>

    <div class="twin-plots-slot"></div>

    <p>If a curve comes to a sudden cusp, as in Figure 25, the slope at that point suddenly changes from a slope upward to a slope downward. In that case <span class="math">\dfrac{dy}{dx}</span> will clearly undergo an abrupt change from a positive to a negative value.</p>
    <div class="static-fig-slot" data-fig="25"></div>

    <p>The following examples show further applications of the principles just explained.</p>
  </section>

  <section class="chapter-section">
    <h2>(4) Tangent slope and angle</h2>
    <p>Find the slope of the tangent to the curve</p>
    <p class="math-display">y = \frac{1}{2x} + 3,</p>
    <p>at the point where <span class="math">x = -1</span>. Find the angle which this tangent makes with the curve <span class="math">y = 2x^2 + 2</span>.</p>

    <p>The slope of the tangent is the slope of the curve at the point where they touch one another; that is, it is the <span class="math">\dfrac{dy}{dx}</span> of the curve for that point. Here <span class="math">\dfrac{dy}{dx} = -\dfrac{1}{2x^2}</span> and for <span class="math">x = -1</span>, <span class="math">\dfrac{dy}{dx} = -\dfrac{1}{2}</span>, which is the slope of the tangent and of the curve at that point. The tangent, being a straight line, has for equation <span class="math">y = ax + b</span>, and its slope is <span class="math">\dfrac{dy}{dx} = a</span>, hence <span class="math">a = -\dfrac{1}{2}</span>. Also if <span class="math">x= -1</span>, <span class="math">y = \dfrac{1}{2(-1)} + 3 = 2\frac{1}{2}</span>; and as the tangent passes by this point, the coordinates of the point must satisfy the equation of the tangent, namely</p>
    <p class="math-display">y = -\dfrac{1}{2} x + b,</p>
    <p>so that <span class="math">2\frac{1}{2} = -\dfrac{1}{2} \times (-1) + b</span> and <span class="math">b = 2</span>; the equation of the tangent is therefore <span class="math">y = -\dfrac{1}{2} x + 2</span>.</p>

    <p>Now, when two curves meet, the intersection being a point common to both curves, its coordinates must satisfy the equation of each one of the two curves; that is, it must be a solution of the system of simultaneous equations formed by coupling together the equations of the curves. Here the curves meet one another at points given by the solution of</p>
    <p class="math-display">\begin{aligned} y &= 2x^2 + 2, \\ y &= -\tfrac{1}{2} x + 2 \quad\text{or}\quad 2x^2 + 2 = -\tfrac{1}{2} x + 2; \end{aligned}</p>
    <p>that is,</p>
    <p class="math-display">x(2x + \tfrac{1}{2}) = 0.</p>

    <p>This equation has for its solutions <span class="math">x = 0</span> and <span class="math">x = -\tfrac{1}{4}</span>. The slope of the curve <span class="math">y = 2x^2 + 2</span> at any point is</p>
    <p class="math-display">\dfrac{dy}{dx} = 4x.</p>

    <p>For the point where <span class="math">x = 0</span>, this slope is zero; the curve is horizontal. For the point where <span class="math">x = -\dfrac{1}{4}</span>, <span class="math">\dfrac{dy}{dx} = -1</span>; hence the curve at that point slopes downwards to the right at such an angle <span class="math">\theta</span> with the horizontal that <span class="math">\tan \theta = 1</span>; that is, at <span class="math">45°</span> to the horizontal.</p>

    <p>The slope of the straight line is <span class="math">-\tfrac{1}{2}</span>; that is, it slopes downwards to the right and makes with the horizontal an angle <span class="math">\phi</span> such that <span class="math">\tan \phi = \tfrac{1}{2}</span>; that is, an angle of <span class="math">26° 34'</span>. It follows that at the first point the curve cuts the straight line at an angle of <span class="math">26° 34'</span>, while at the second it cuts it at an angle of <span class="math">45° - 26° 34' = 18° 26'</span>.</p>
  </section>

  <section class="chapter-section">
    <h2>(5) Point of contact</h2>
    <p>A straight line is to be drawn, through a point whose coordinates are <span class="math">x = 2</span>, <span class="math">y = -1</span>, as tangent to the curve <span class="math">y = x^2 - 5x + 6</span>. Find the coordinates of the point of contact.</p>

    <p>The slope of the tangent must be the same as the <span class="math">\dfrac{dy}{dx}</span> of the curve; that is, <span class="math">2x - 5</span>.</p>

    <p>The equation of the straight line is <span class="math">y = ax + b</span>, and as it is satisfied for the values <span class="math">x = 2</span>, <span class="math">y = -1</span>, then <span class="math">-1 = a\times2 + b</span>; also, its <span class="math">\dfrac{dy}{dx} = a = 2x - 5</span>.</p>

    <p>The <span class="math">x</span> and the <span class="math">y</span> of the point of contact must also satisfy both the equation of the tangent and the equation of the curve.</p>

    <p>We have then</p>
    <p class="math-display">\begin{aligned} y &= x^2 - 5x + 6, \quad(i) \\ y &= ax + b, \quad(ii) \\ -1 &= 2a + b, \quad(iii) \\ a &= 2x - 5, \quad(iv) \end{aligned}</p>
    <p>four equations in <span class="math">a</span>, <span class="math">b</span>, <span class="math">x</span>, <span class="math">y</span>.</p>

    <p>Equations (i) and (ii) give <span class="math">x^2 - 5x + 6 = ax+b</span>.</p>

    <p>Replacing <span class="math">a</span> and <span class="math">b</span> by their value in this, we get</p>
    <p class="math-display">x^2 - 5x + 6 = (2x - 5)x - 1 - 2(2x - 5),</p>
    <p>which simplifies to <span class="math">x^2 - 4x + 3 = 0</span>, the solutions of which are: <span class="math">x = 3</span> and <span class="math">x = 1</span>. Replacing in (i), we get <span class="math">y = 0</span> and <span class="math">y = 2</span> respectively; the two points of contact are then <span class="math">x = 1</span>, <span class="math">y = 2</span>, and <span class="math">x = 3</span>, <span class="math">y = 0</span>.</p>

    <p class="chapter-note">Note: In all exercises dealing with curves, students will find it extremely instructive to verify the deductions obtained by actually plotting the curves.</p>
  </section>

  <section class="chapter-section exercises">
    <h2>Exercises VIII</h2>
    <ol>
      <li>Plot the curve <span class="math">y = \tfrac{3}{4} x^2 - 5</span>, using a scale of millimetres. Measure at points corresponding to different values of <span class="math">x</span>, the angle of its slope. Find, by differentiating the equation, the expression for slope; and see, from a Table of Natural Tangents, whether this agrees with the measured angle.</li>
      <li>Find what will be the slope of the curve <span class="math">y = 0.12x^3 - 2</span>, at the particular point that has as abscissa <span class="math">x = 2</span>.</li>
      <li>If <span class="math">y = (x - a)(x - b)</span>, show that at the particular point of the curve where <span class="math">\dfrac{dy}{dx} = 0</span>, <span class="math">x</span> will have the value <span class="math">\tfrac{1}{2} (a + b)</span>.</li>
      <li>Find the <span class="math">\dfrac{dy}{dx}</span> of the equation <span class="math">y = x^3 + 3x</span>; and calculate the numerical values of <span class="math">\dfrac{dy}{dx}</span> for the points corresponding to <span class="math">x = 0</span>, <span class="math">x = \tfrac{1}{2}</span>, <span class="math">x = 1</span>, <span class="math">x = 2</span>.</li>
      <li>In the curve to which the equation is <span class="math">x^2 + y^2 = 4</span>, find the values of <span class="math">x</span> at those points where the slope <span class="math">= 1</span>.</li>
      <li>Find the slope, at any point, of the curve whose equation is <span class="math">\dfrac{x^2}{3^2} + \dfrac{y^2}{2^2} = 1</span>; and give the numerical value of the slope at the place where <span class="math">x = 0</span>, and at that where <span class="math">x = 1</span>.</li>
      <li>The equation of a tangent to the curve <span class="math">y = 5 - 2x + 0.5x^3</span>, being of the form <span class="math">y = mx + n</span>, where <span class="math">m</span> and <span class="math">n</span> are constants, find the value of <span class="math">m</span> and <span class="math">n</span> if the point where the tangent touches the curve has <span class="math">x=2</span> for abscissa.</li>
      <li>At what angle do the two curves <span class="math">y = 3.5x^2 + 2</span> and <span class="math">y = x^2 - 5x + 9.5</span> cut one another?</li>
      <li>Tangents to the curve <span class="math">y = \pm \sqrt{25-x^2}</span> are drawn at points for which <span class="math">x = 3</span> and <span class="math">x = 4</span>. Find the coordinates of the point of intersection of the tangents and their mutual inclination.</li>
      <li>A straight line <span class="math">y = 2x - b</span> touches a curve <span class="math">y = 3x^2 + 2</span> at one point. What are the coordinates of the point of contact, and what is the value of <span class="math">b</span>?</li>
    </ol>
  </section>

  <section class="chapter-section answers">
    <h2>Answers</h2>
    <ol start="2">
      <li><span class="math">1.44</span>.</li>
    </ol>
    <ol start="4">
      <li><span class="math">\dfrac{dy}{dx} = 3x^2 + 3</span>; and the numerical values are: <span class="math">3</span>, <span class="math">3 \frac{3}{4}</span>, <span class="math">6</span>, and <span class="math">15</span>.</li>
      <li><span class="math">\pm \sqrt{2}</span>.</li>
      <li><span class="math">\dfrac{dy}{dx} = - \dfrac{4}{9} \dfrac{x}{y}</span>. Slope is zero where <span class="math">x = 0</span>; and is <span class="math">\mp \dfrac{1}{3 \sqrt{2}}</span> where <span class="math">x = 1</span>.</li>
      <li><span class="math">m = 4</span>, <span class="math">n = -3</span>.</li>
      <li>Intersections at <span class="math">x = 1</span>, <span class="math">x = -3</span>. Angles <span class="math">153°\;26'</span>, <span class="math">2°\;28'</span>.</li>
      <li>Intersection at <span class="math">x = 3.57</span>, <span class="math">y = 3.50</span>. Angle <span class="math">16°\;16'</span>.</li>
      <li><span class="math">x = \frac{1}{3}</span>, <span class="math">y = 2 \frac{1}{3}</span>, <span class="math">b = -\frac{5}{3}</span>.</li>
    </ol>
  </section>
`;
