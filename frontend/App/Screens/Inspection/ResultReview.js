import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResultReview = ({ route, navigation }) => {
  const apiData =
    route.params?.apiData ||
    route.params?.report ||
    {};

  const [isConfirmed, setIsConfirmed] = useState(false);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary =
    apiData.summary ||
    apiData.report?.summary ||
    {};

  const overallStatus =
    summary.overall_status ||
    apiData.status ||
    'REVIEW';

  const score =
    summary.score !== undefined &&
    summary.score !== null
      ? Number(summary.score).toFixed(2)
      : '0.00';

  const passedCount =
    Number(summary.passed || 0);

  const failedCount =
    Number(summary.failed || 0);

  const reviewCount =
    Number(summary.review || 0);

  // =========================================================
  // EXTRACTED FIELDS
  // =========================================================
  //
  // We check several possible API response locations.
  //
  // IMPORTANT:
  // We only accept an object if it actually contains known
  // extracted-field keys.
  //
  // This prevents rule results / detailed_results from being
  // displayed as extracted field values such as "100".
  // =========================================================

  const FIELD_KEYS = [
    'product_name',
    'mrp',
    'net_quantity',
    'manufacturer',
    'manufacture_date',
    'country_of_origin',
    'best_before',
    'consumer_care',
    'unit_sale_price',
    'batch_number',
  ];

  const looksLikeExtractedFields = (obj) => {
    if (
      !obj ||
      typeof obj !== 'object' ||
      Array.isArray(obj)
    ) {
      return false;
    }

    return FIELD_KEYS.some((key) =>
      Object.prototype.hasOwnProperty.call(obj, key)
    );
  };

  const getExtractedFields = (data) => {
    if (
      !data ||
      typeof data !== 'object'
    ) {
      return {};
    }

    // -------------------------------------------------------
    // 1. Direct extracted_fields
    // -------------------------------------------------------

    if (
      looksLikeExtractedFields(
        data.extracted_fields
      )
    ) {
      return data.extracted_fields;
    }

    // -------------------------------------------------------
    // 2. OCR extracted_fields
    // -------------------------------------------------------

    if (
      looksLikeExtractedFields(
        data.ocr_data?.extracted_fields
      )
    ) {
      return data.ocr_data.extracted_fields;
    }

    // -------------------------------------------------------
    // 3. Direct data
    // -------------------------------------------------------

    if (
      looksLikeExtractedFields(
        data.data
      )
    ) {
      return data.data;
    }

    // -------------------------------------------------------
    // 4. OCR data itself
    // -------------------------------------------------------

    if (
      looksLikeExtractedFields(
        data.ocr_data
      )
    ) {
      return data.ocr_data;
    }

    // -------------------------------------------------------
    // 5. Nested report extracted_fields
    // -------------------------------------------------------

    if (
      looksLikeExtractedFields(
        data.report?.extracted_fields
      )
    ) {
      return data.report.extracted_fields;
    }

    // -------------------------------------------------------
    // 6. Nested report data
    // -------------------------------------------------------

    if (
      looksLikeExtractedFields(
        data.report?.data
      )
    ) {
      return data.report.data;
    }

    return {};
  };

  const rawFields =
    getExtractedFields(apiData);

  // =========================================================
  // FIELD VALUE READER
  // =========================================================

  const getValue = (key) => {
    const val = rawFields[key];

    if (
      val === null ||
      val === undefined ||
      val === ''
    ) {
      return 'Not detected';
    }

    // -------------------------------------------------------
    // Structured object
    // -------------------------------------------------------

    if (
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {

      // Consumer care
      if (key === 'consumer_care') {

        const parts = [];

        if (val.phone) {
          parts.push(
            `Phone: ${String(val.phone)}`
          );
        }

        if (val.email) {
          parts.push(
            `Email: ${String(val.email)}`
          );
        }

        if (val.website) {
          parts.push(
            `Web: ${String(val.website)}`
          );
        }

        if (parts.length > 0) {
          return parts.join(' · ');
        }
      }

      // Objects such as:
      // { value: "...", confidence: ... }

      if (
        val.value !== undefined &&
        val.value !== null &&
        val.value !== ''
      ) {
        return String(val.value);
      }

      return 'Not detected';
    }

    return String(val);
  };

  // =========================================================
  // EXTRACTED VALUES
  // =========================================================

  const productName =
    getValue('product_name');

  const mrp =
    getValue('mrp');

  const netQuantity =
    getValue('net_quantity');

  const manufacturer =
    getValue('manufacturer');

  const mfgDate =
    getValue('manufacture_date');

  const countryOfOrigin =
    getValue('country_of_origin');

  const bestBefore =
    getValue('best_before');

  const consumerCare =
    getValue('consumer_care');

  const unitSalePrice =
    getValue('unit_sale_price');

  // =========================================================
  // RULE RESULTS
  // =========================================================
  //
  // Prefer rule_results because it contains all rule statuses.
  // =========================================================

  const ruleResults =
    (Array.isArray(apiData.rule_results) &&
      apiData.rule_results) ||
    (Array.isArray(apiData.ruleResults) &&
      apiData.ruleResults) ||
    (Array.isArray(apiData.evaluations) &&
      apiData.evaluations) ||
    (Array.isArray(apiData.violations) &&
      apiData.violations) ||
    [];

  // =========================================================
  // CONFIRM
  // =========================================================

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  // =========================================================
  // FULL REPORT
  // =========================================================

const handleViewFullReport = () => {
  const capturedImages =
    route.params?.images ||
    route.params?.imageUris ||
    route.params?.capturedImages ||
    route.params?.captured_images ||
    apiData?.images ||
    apiData?.imageUris ||
    apiData?.image_uris ||
    apiData?.capturedImages ||
    apiData?.captured_images ||
    [];

  navigation.navigate('ReportViewer', {
    reportData: {
      ...apiData,
      images: capturedImages,
    },
    isConfirmed,
  });
};

  // =========================================================
  // RULE VALUE FORMATTER
  // =========================================================

  const getValueFromRule = (val) => {

    if (
      val === null ||
      val === undefined ||
      val === ''
    ) {
      return 'Not detected';
    }

    if (
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {

      // Formatter object
      if (
        val.value !== undefined &&
        val.value !== null &&
        val.value !== ''
      ) {
        return String(val.value);
      }

      // Consumer care object
      if (
        val.phone ||
        val.email ||
        val.website
      ) {
        return [
          val.phone
            ? `Phone: ${val.phone}`
            : null,

          val.email
            ? `Email: ${val.email}`
            : null,

          val.website
            ? `Web: ${val.website}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ');
      }

      return 'Not detected';
    }

    return String(val);
  };

  // =========================================================
  // SAFE DISPLAY
  // =========================================================

  const displayValue = (val) => {

    if (
      val === null ||
      val === undefined ||
      val === ''
    ) {
      return 'Not detected';
    }

    if (
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {

      if (
        val.value !== undefined &&
        val.value !== null &&
        val.value !== ''
      ) {
        return String(val.value);
      }

      return 'Not detected';
    }

    return String(val);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ===================================================
            HEADER
        ==================================================== */}

        <View style={styles.headerRow}>

          <View style={{ flex: 1 }}>

            <Text
              style={styles.title}
              numberOfLines={2}
            >
              Inspection Result
            </Text>

            <Text style={styles.subtitle}>
              OCR & Legal Metrology evaluation
            </Text>

          </View>

          <View
            style={[
              styles.statusBadge,

              overallStatus === 'PASS'
                ? styles.statusPassBg
                : overallStatus === 'FAIL'
                ? styles.statusFailBg
                : styles.statusReviewBg,
            ]}
          >

            <Text
              style={[
                styles.statusText,

                overallStatus === 'PASS'
                  ? styles.statusPassText
                  : overallStatus === 'FAIL'
                  ? styles.statusFailText
                  : styles.statusReviewText,
              ]}
            >
              {overallStatus}
            </Text>

          </View>

        </View>

        {/* ===================================================
            SCORE CARD
        ==================================================== */}

        <View style={styles.scoreCard}>

          <View>

            <Text style={styles.scoreLabel}>
              Compliance score
            </Text>

            <Text style={styles.scoreSubtext}>
              {passedCount} passed · {failedCount} failed ·{' '}
              {reviewCount} review
            </Text>

          </View>

          <Text style={styles.scoreValue}>
            {score}
          </Text>

        </View>

        {/* ===================================================
            EXTRACTED FIELDS
        ==================================================== */}

        <Text style={styles.sectionHeader}>
          EXTRACTED FIELDS
        </Text>

        <View style={styles.card}>

          {/* PRODUCT NAME */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              Product name
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                productName === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(productName)}
            </Text>

          </View>

          {/* MRP */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              MRP
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                mrp === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {mrp !== 'Not detected'
                ? `₹${mrp}`
                : 'Not detected'}
            </Text>

          </View>

          {/* NET QUANTITY */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              Net quantity
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                netQuantity === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(netQuantity)}
            </Text>

          </View>

          {/* MANUFACTURER */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              Manufacturer
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                {
                  flex: 1,
                  textAlign: 'right',
                  marginLeft: 15,
                },

                manufacturer === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(manufacturer)}
            </Text>

          </View>

          {/* MANUFACTURE DATE */}

          <View
            style={[
              styles.fieldRow,
              {
                borderBottomWidth: 0,
              },
            ]}
          >

            <Text style={styles.fieldLabel}>
              Mfg. date
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                mfgDate === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(mfgDate)}
            </Text>

          </View>

        </View>

        {/* ===================================================
            RULE RESULTS
        ==================================================== */}

        <Text style={styles.sectionHeader}>
          RULE RESULTS
        </Text>

        {ruleResults.length === 0 ? (

          <View style={styles.ruleCard}>

            <Text style={styles.ruleMessage}>
              No rule results were returned by the
              compliance engine.
            </Text>

          </View>

        ) : (

          ruleResults.map((item, index) => {

            const ruleName =
              item.rule_name ||
              item.field ||
              item.ruleName ||
              'Rule';

            const formattedName =
              String(ruleName)
                .replace(/_/g, ' ')
                .replace(
                  /\b\w/g,
                  (l) => l.toUpperCase()
                );

            const status =
              item.status ||
              'REVIEW';

            const statusStyle =
              styles[`badge_${status}`] ||
              styles.badge_REVIEW;

            return (

              <View
                key={`${item.rule_id || ruleName}-${index}`}
                style={styles.ruleCard}
              >

                <View style={styles.ruleHeader}>

                  <Text style={styles.ruleTitle}>
                    {formattedName}
                  </Text>

                  <Text
                    style={[
                      styles.ruleBadge,
                      statusStyle,
                    ]}
                  >
                    {status}
                  </Text>

                </View>

                <Text style={styles.ruleMessage}>
                  {item.message ||
                    'Verification required.'}
                </Text>

                {item.value !== null &&
                item.value !== undefined &&
                item.value !== '' ? (

                  <Text style={styles.detectedText}>

                    Detected:{' '}

                    <Text style={styles.detectedValue}>
                      {getValueFromRule(item.value)}
                    </Text>

                  </Text>

                ) : null}

              </View>
            );
          })
        )}

        {/* ===================================================
            ADDITIONAL INFORMATION
        ==================================================== */}

        <Text style={styles.sectionHeader}>
          ADDITIONAL INFORMATION
        </Text>

        <View style={styles.card}>

          {/* COUNTRY OF ORIGIN */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              Country of origin
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                countryOfOrigin === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(countryOfOrigin)}
            </Text>

          </View>

          {/* BEST BEFORE */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              Best before
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                bestBefore === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(bestBefore)}
            </Text>

          </View>

          {/* CONSUMER CARE */}

          <View style={styles.fieldRow}>

            <Text style={styles.fieldLabel}>
              Consumer care
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                {
                  flex: 1,
                  textAlign: 'right',
                  marginLeft: 15,
                },

                consumerCare === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(consumerCare)}
            </Text>

          </View>

          {/* UNIT SALE PRICE */}

          <View
            style={[
              styles.fieldRow,
              {
                borderBottomWidth: 0,
              },
            ]}
          >

            <Text style={styles.fieldLabel}>
              Unit sale price
            </Text>

            <Text
              style={[
                styles.fieldValueBold,

                unitSalePrice === 'Not detected' &&
                  styles.notDetectedText,
              ]}
            >
              {displayValue(unitSalePrice)}
            </Text>

          </View>

        </View>

        {/* ===================================================
            ACTION BUTTONS
        ==================================================== */}

        <View style={styles.actionRow}>

          {/* OVERRIDE */}

          <TouchableOpacity
            style={styles.overrideButton}
            onPress={() =>
              navigation.navigate(
                'OverrideScreen',
                {
                  apiData,
                }
              )
            }
          >

            <Text style={styles.overrideButtonText}>
              Override
            </Text>

          </TouchableOpacity>

          {/* CONFIRM */}

          <TouchableOpacity
            style={[
              styles.confirmButton,

              isConfirmed &&
                styles.confirmedButtonState,
            ]}
            onPress={handleConfirm}
            disabled={isConfirmed}
          >

            <Text style={styles.confirmButtonText}>
              {isConfirmed
                ? 'Confirmed ✓'
                : 'Confirm'}
            </Text>

          </TouchableOpacity>

        </View>

        {/* ===================================================
            FULL REPORT
        ==================================================== */}

        <TouchableOpacity
          style={styles.fullReportButton}
          onPress={handleViewFullReport}
        >

          <Text style={styles.fullReportButtonText}>
            View full report
          </Text>

        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>
  );
};

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  // -----------------------------------------------------------
  // HEADER
  // -----------------------------------------------------------

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
  },

  subtitle: {
    fontSize: 13,
    color: '#667085',
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusFailBg: {
    backgroundColor: '#FEE4E2',
  },

  statusFailText: {
    color: '#D92D20',
    fontWeight: '700',
    fontSize: 12,
  },

  statusPassBg: {
    backgroundColor: '#D1FADF',
  },

  statusPassText: {
    color: '#039855',
    fontWeight: '700',
    fontSize: 12,
  },

  statusReviewBg: {
    backgroundColor: '#FEF7E0',
  },

  statusReviewText: {
    color: '#B06000',
    fontWeight: '700',
    fontSize: 12,
  },

  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },

  // -----------------------------------------------------------
  // SCORE
  // -----------------------------------------------------------

  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 24,
  },

  scoreLabel: {
    fontSize: 14,
    color: '#475467',
    fontWeight: '500',
  },

  scoreSubtext: {
    fontSize: 12,
    color: '#98A2B3',
    marginTop: 4,
  },

  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#101828',
  },

  // -----------------------------------------------------------
  // SECTION HEADERS
  // -----------------------------------------------------------

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // -----------------------------------------------------------
  // CARDS
  // -----------------------------------------------------------

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 24,
  },

  // -----------------------------------------------------------
  // FIELD ROWS
  // -----------------------------------------------------------

  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },

  fieldLabel: {
    fontSize: 14,
    color: '#667085',
  },

  fieldValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
  },

  notDetectedText: {
    color: '#D92D20',
    fontWeight: '600',
  },

  // -----------------------------------------------------------
  // RULE CARDS
  // -----------------------------------------------------------

  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 12,
  },

  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ruleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
    flex: 1,
    marginRight: 10,
  },

  ruleMessage: {
    fontSize: 13,
    color: '#475467',
    marginTop: 6,
  },

  detectedText: {
    fontSize: 12,
    color: '#667085',
    marginTop: 6,
  },

  detectedValue: {
    fontWeight: '600',
    color: '#101828',
  },

  ruleBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  badge_PASS: {
    backgroundColor: '#E6F4EA',
    color: '#137333',
  },

  badge_FAIL: {
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
  },

  badge_REVIEW: {
    backgroundColor: '#FEF7E0',
    color: '#B06000',
  },

  badge_NOT_APPLICABLE: {
    backgroundColor: '#F2F4F7',
    color: '#5F6368',
  },

  // -----------------------------------------------------------
  // ACTION BUTTONS
  // -----------------------------------------------------------

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },

  overrideButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  overrideButtonText: {
    color: '#344054',
    fontWeight: '600',
    fontSize: 16,
  },

  confirmButton: {
    flex: 1,
    backgroundColor: '#0B132B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  confirmedButtonState: {
    backgroundColor: '#10B981',
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  // -----------------------------------------------------------
  // FULL REPORT
  // -----------------------------------------------------------

  fullReportButton: {
    backgroundColor: '#EAECF0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  fullReportButtonText: {
    color: '#344054',
    fontWeight: '600',
    fontSize: 15,
  },

});

export default ResultReview;