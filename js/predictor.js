/**
 * Setu — DSE Predictor Engine
 * -----------------------------------------------------------------------
 * This module owns the ONLY logic that decides admission predictions.
 * Business rule (must stay mathematically identical):
 *
 *   Selected Category
 *        |
 *   Category Cutoff Lookup        (look up the user's category column
 *        |                         for this course)
 *   Fallback to GOPEN              (if that category has no seat/cutoff
 *        |                         recorded for this course, fall back
 *        |                         to the GOPEN — General Open — cutoff)
 *   Eligibility Calculation        (compare user % to the cutoff %)
 *        |
 *   Admission Status               (High / Moderate / Low / Not Eligible)
 *
 * Status thresholds (fixed, do not change):
 *   HIGH      userPct >= cutoffPct + 2
 *   MODERATE  userPct >= cutoffPct
 *   LOW       userPct >= cutoffPct - 3
 *   else      Not Eligible (excluded from results)
 * -----------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  // Ladies categories (L-prefix) fall back through the matching General
  // (G-prefix) category before falling back to GOPEN. e.g. LOBC -> GOBC -> GOPEN
  function ladiesParent(cat) {
    if (cat.charAt(0) === 'L') return 'G' + cat.slice(1);
    return null;
  }

  /**
   * Resolve which category column a course actually has data for, given
   * the student's selected category, applying fallback rules.
   * Returns { usedCategory, cutoff, fellBack } or null if no usable cutoff exists.
   */
  function resolveCutoff(courseCategories, selectedCategory) {
    if (!courseCategories) return null;

    // 1. Exact category match
    if (courseCategories[selectedCategory]) {
      return {
        usedCategory: selectedCategory,
        cutoff: courseCategories[selectedCategory],
        fellBack: false,
      };
    }

    // 2. Ladies categories fall back to their General equivalent first
    const parent = ladiesParent(selectedCategory);
    if (parent && courseCategories[parent]) {
      return {
        usedCategory: parent,
        cutoff: courseCategories[parent],
        fellBack: true,
      };
    }

    // 3. Fallback to GOPEN
    if (courseCategories.GOPEN) {
      return {
        usedCategory: 'GOPEN',
        cutoff: courseCategories.GOPEN,
        fellBack: true,
      };
    }

    // 4. Ladies with no General/GOPEN path also try LOPEN as a last resort
    if (selectedCategory.charAt(0) === 'L' && courseCategories.LOPEN) {
      return {
        usedCategory: 'LOPEN',
        cutoff: courseCategories.LOPEN,
        fellBack: true,
      };
    }

    return null;
  }

  /** Admission status from user % vs the resolved cutoff %. */
  function admissionStatus(userPct, cutoffPct) {
    if (userPct >= cutoffPct + 2) return 'high';
    if (userPct >= cutoffPct) return 'moderate';
    if (userPct >= cutoffPct - 3) return 'low';
    return null; // not eligible — excluded from results
  }

  /** Government / Autonomous / University Department / Minority / Un-Aided. */
  function detectCollegeType(typeRawOrName) {
    const s = typeRawOrName || '';
    if (s.indexOf('Government') !== -1) return 'Government';
    if (s.indexOf('Autonomous') !== -1) return 'Autonomous';
    if (s.indexOf('University') !== -1) return 'University Department';
    if (s.indexOf('Minority') !== -1) return 'Minority';
    return 'Un-Aided';
  }

  /**
   * Run a full prediction.
   * @param {Object} input { percentage:number, category:string, regions:string[], branchQuery:string }
   * @param {Object} data  window.SETU_DATA
   * @returns {Array} sorted (best chance first) list of prediction rows
   */
  function predict(input, data) {
    const userPct = Number(input.percentage);
    const category = input.category;
    const regionFilter = input.regions && input.regions.length ? new Set(input.regions) : null;
    const branchQuery = (input.branchQuery || '').trim().toLowerCase();

    const collegeByCode = {};
    data.colleges.forEach(function (c) {
      collegeByCode[c.code] = c;
    });

    const results = [];

    for (let i = 0; i < data.courses.length; i++) {
      const course = data.courses[i];
      const college = collegeByCode[course.collegeCode];
      if (!college) continue;

      if (regionFilter && !regionFilter.has(college.region)) continue;
      if (branchQuery && course.course.toLowerCase().indexOf(branchQuery) === -1) continue;

      const resolved = resolveCutoff(course.cat, category);
      if (!resolved) continue;

      const cutoffPct = resolved.cutoff.pct;
      const status = admissionStatus(userPct, cutoffPct);
      if (!status) continue;

      results.push({
        collegeCode: college.code,
        collegeName: college.name,
        collegeType: college.type,
        region: college.region,
        choiceCode: course.choiceCode,
        course: course.course,
        categoryUsed: resolved.usedCategory,
        fellBackToOpen: resolved.fellBack,
        cutoffRank: resolved.cutoff.rank,
        cutoffPct: cutoffPct,
        userPct: userPct,
        status: status,
      });
    }

    // Default sort: best chance first, then tightest cutoff first
    results.sort(function (a, b) {
      const order = { high: 0, moderate: 1, low: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return b.cutoffPct - a.cutoffPct;
    });

    return results;
  }

  global.SetuPredictor = {
    resolveCutoff: resolveCutoff,
    admissionStatus: admissionStatus,
    detectCollegeType: detectCollegeType,
    predict: predict,
  };
})(window);
