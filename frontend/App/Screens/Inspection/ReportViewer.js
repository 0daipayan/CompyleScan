import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ReportViewer = ({ route, navigation }) => {
  const reportData = route?.params?.reportData || {};

// =========================================================
// OCR / EXTRACTED DATA
// =========================================================

const extractedFields =
  reportData?.ocr_data?.extracted_fields ||
  reportData?.extracted_fields ||
  reportData?.data?.extracted_fields ||
  reportData?.ocr_data?.data ||
  reportData?.data ||
  {};

// ---------------------------------------------------------
// SAFELY EXTRACT VALUE FROM API OBJECTS
// ---------------------------------------------------------

const unwrapValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  // Normal string / number
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return value;
  }

  // Object
  if (typeof value === 'object') {

    // Common API format
    if (
      value.value !== undefined &&
      value.value !== null
    ) {
      return unwrapValue(value.value);
    }

    // Alternative formats
    if (
      value.text !== undefined &&
      value.text !== null
    ) {
      return unwrapValue(value.text);
    }

    if (
      value.raw !== undefined &&
      value.raw !== null
    ) {
      return unwrapValue(value.raw);
    }

    if (
      value.normalized !== undefined &&
      value.normalized !== null
    ) {
      return unwrapValue(value.normalized);
    }

    if (
      value.result !== undefined &&
      value.result !== null
    ) {
      return unwrapValue(value.result);
    }

    return null;
  }

  return null;
};

const getValue = (key) => {
  const rawValue = extractedFields?.[key];

  const value = unwrapValue(rawValue);

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return 'Not detected';
  }

  return String(value);
};

// =========================================================
// PRODUCT DETAILS
// =========================================================

const productName =
  getValue('product_name');

const manufacturer =
  getValue('manufacturer');

const countryOfOrigin =
  getValue('country_of_origin');

const manufactureDate =
  getValue('manufacture_date');

const netQuantity =
  getValue('net_quantity');

// =========================================================
// MRP
// =========================================================

const rawMrp =
  extractedFields?.mrp;

const mrpValue =
  unwrapValue(rawMrp);

const mrp =
  mrpValue !== null &&
  mrpValue !== undefined &&
  String(mrpValue).trim() !== ''
    ? `₹${String(mrpValue).replace(/^₹/, '')}`
    : 'Not detected';

// =========================================================
// CONSUMER CARE
// =========================================================

const consumerCare =
  extractedFields?.consumer_care;

let consumerPhone =
  'Not detected';

let consumerEmail =
  null;

if (
  consumerCare &&
  typeof consumerCare === 'object'
) {

  consumerPhone =
    unwrapValue(
      consumerCare.phone
    ) || 'Not detected';

  consumerEmail =
    unwrapValue(
      consumerCare.email
    );

} else {

  const consumerValue =
    unwrapValue(consumerCare);

  if (consumerValue) {
    consumerPhone =
      String(consumerValue);
  }
}
  // =========================================================
  // RULE FINDINGS
  // IMPORTANT: ALWAYS FORCE THIS TO AN ARRAY
  // =========================================================

  let findings = [];

  if (Array.isArray(reportData?.detailed_results)) {
    findings = reportData.detailed_results;
  } else if (Array.isArray(reportData?.rule_results)) {
    findings = reportData.rule_results;
  } else if (Array.isArray(reportData?.ruleResults)) {
    findings = reportData.ruleResults;
  } else if (
    Array.isArray(reportData?.data?.detailed_results)
  ) {
    findings = reportData.data.detailed_results;
  } else if (
    Array.isArray(reportData?.data?.rule_results)
  ) {
    findings = reportData.data.rule_results;
  }

  // =========================================================
  // COMPLIANCE SUMMARY
  // =========================================================

  const summary =
    reportData?.summary ||
    reportData?.data?.summary ||
    {};

  const passed = Number(
    summary?.passed !== undefined
      ? summary.passed
      : findings.filter(
          item => item?.status === 'PASS'
        ).length
  );

  const failed = Number(
    summary?.failed !== undefined
      ? summary.failed
      : findings.filter(
          item => item?.status === 'FAIL'
        ).length
  );

  const review = Number(
    summary?.review !== undefined
      ? summary.review
      : findings.filter(
          item => item?.status === 'REVIEW'
        ).length
  );

  const notApplicable = Number(
    summary?.not_applicable !== undefined
      ? summary.not_applicable
      : findings.filter(
          item => item?.status === 'NOT_APPLICABLE'
        ).length
  );

  const applicableRules =
    passed + failed + review;

  const overallStatus =
    summary?.overall_status ||
    reportData?.overall_status ||
    reportData?.data?.overall_status ||
    (failed > 0 || review > 0
      ? 'FAIL'
      : 'PASS');

  // =========================================================
  // CAPTURED IMAGES
  // =========================================================

  const images =
    reportData?.images ||
    reportData?.imageUris ||
    reportData?.image_uris ||
    reportData?.capturedImages ||
    reportData?.captured_images ||
    reportData?.data?.images ||
    [];

  const normalizedImages = Array.isArray(images)
    ? images
        .map(item => {
          if (!item) {
            return null;
          }

          if (typeof item === 'string') {
            return item;
          }

          if (typeof item === 'object') {
            return (
              item.uri ||
              item.url ||
              item.path ||
              item.imageUri ||
              item.image_uri ||
              null
            );
          }

          return null;
        })
        .filter(Boolean)
    : [];

  // =========================================================
  // REPORT DATE
  // =========================================================

  const reportDate =
    reportData?.timestamp ||
    reportData?.created_at ||
    reportData?.createdAt ||
    reportData?.data?.timestamp ||
    null;

  let formattedDate = 'Sep 23, 2026';

  if (reportDate) {
    const dateString = String(reportDate);

    // Simple and React-Native-safe formatting.
    if (dateString.length >= 10) {
      const datePart =
        dateString.substring(0, 10);

      const parts = datePart.split('-');

      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];

        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];

        const monthIndex =
          parseInt(month, 10) - 1;

        if (
          monthIndex >= 0 &&
          monthIndex < 12
        ) {
          formattedDate =
            `${day} ${months[monthIndex]} ${year}`;
        }
      }
    }
  }

  // =========================================================
  // PDF
  // =========================================================

  const handleDownloadPDF = async () => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 32px;
            color: #101828;
          }

          .header {
            border-bottom: 1px solid #E4E7EC;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }

          .tag {
            color: #667085;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          h1 {
            font-size: 28px;
            margin: 10px 0 5px;
          }

          .date {
            color: #98A2B3;
            font-size: 14px;
          }

          .section {
            margin-top: 25px;
            margin-bottom: 10px;
            color: #667085;
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #F2F4F7;
          }

          .label {
            color: #667085;
            font-size: 14px;
          }

          .value {
            font-weight: bold;
            font-size: 14px;
            text-align: right;
          }

          .status {
            padding: 18px;
            border: 1px solid #A6F4C5;
            background: #ECFDF3;
            border-radius: 12px;
            margin-top: 10px;
          }

          .status-title {
            color: #039855;
            font-size: 22px;
            font-weight: bold;
          }

          .rule {
            padding: 12px 0;
            border-bottom: 1px solid #F2F4F7;
          }

          .rule-name {
            font-weight: bold;
            font-size: 15px;
          }

          .pass {
            color: #039855;
            font-weight: bold;
            margin-top: 4px;
          }

          .review {
            color: #B54708;
            font-weight: bold;
            margin-top: 4px;
          }

          .fail {
            color: #D92D20;
            font-weight: bold;
            margin-top: 4px;
          }

          .message {
            color: #667085;
            font-size: 13px;
            margin-top: 5px;
          }

          .footer {
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid #E4E7EC;
            color: #98A2B3;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>

      <body>

        <div class="header">
          <div class="tag">LEGAL METROLOGY · INSPECTION REPORT</div>

          <h1>${productName}</h1>

          <div class="date">
            Live Scan · ${new Date().toLocaleDateString('en-IN')}
          </div>
        </div>

        <div class="section">
          PRODUCT DETAILS
        </div>

        <div class="row">
          <span class="label">Product</span>
          <span class="value">${productName}</span>
        </div>

        <div class="row">
          <span class="label">Manufacturer</span>
          <span class="value">${manufacturer}</span>
        </div>

        <div class="row">
          <span class="label">Country of Origin</span>
          <span class="value">${countryOfOrigin}</span>
        </div>

        <div class="row">
          <span class="label">Manufacture Date</span>
          <span class="value">${manufactureDate}</span>
        </div>

        <div class="row">
          <span class="label">Net Quantity</span>
          <span class="value">${netQuantity}</span>
        </div>

        <div class="row">
          <span class="label">MRP</span>
          <span class="value">${mrp}</span>
        </div>

        <div class="row">
          <span class="label">Consumer Care</span>
          <span class="value">${consumerPhone}</span>
        </div>

        <div class="section">
          COMPLIANCE STATUS
        </div>

        <div class="status">
          <div class="status-title">
            ${overallStatus}
          </div>

          <div style="margin-top:8px;">
            ${passed} / ${passed + failed + review}
            applicable requirements satisfied
          </div>
        </div>

        <div class="section">
          RULE-BY-RULE FINDINGS
        </div>

        ${
          findings.length > 0
            ? findings.map((item) => {

                const ruleName =
                  item.rule_name ||
                  item.field ||
                  item.ruleName ||
                  'Rule';

                const status =
                  item.status || 'REVIEW';

                const statusClass =
                  status === 'PASS'
                    ? 'pass'
                    : status === 'FAIL'
                    ? 'fail'
                    : 'review';

                return `
                  <div class="rule">

                    <div class="rule-name">
                      ${String(ruleName)
                        .replace(/_/g, ' ')}
                    </div>

                    <div class="${statusClass}">
                      ${status}
                    </div>

                    <div class="message">
                      ${item.message || 'Verification required.'}
                    </div>

                  </div>
                `;
              }).join('')
            : `
              <div class="rule">
                <div class="pass">
                  ✓ All applicable requirements satisfied.
                </div>
              </div>
            `
        }

        <div class="footer">
          Legal Metrology Compliance Report<br/>
          Rule Set: v2026.09-r1
        </div>

      </body>
      </html>
    `;

    const options = {
      html,
      fileName: `Legal_Metrology_${productName
        .replace(/[^a-zA-Z0-9]/g, '_')}`,
      directory: 'Documents',
    };

const file = await generatePDF(options);

if (!file?.filePath) {
  throw new Error('PDF was generated but no file path was returned.');
}

const pdfPath = file?.filePath;

if (!pdfPath) {
  throw new Error('PDF path was not returned.');
}

console.log('ORIGINAL PDF PATH:', pdfPath);

// ---------------------------------------------------------
// COPY PDF TO CACHE DIRECTORY FOR ANDROID SHARING
// ---------------------------------------------------------

const safeProductName = productName
  .replace(/[^a-zA-Z0-9-_]/g, '_');

const shareFileName =
  `Legal_Metrology_${safeProductName}.pdf`;

const cachePath =
  `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${shareFileName}`;

console.log('CACHE PDF PATH:', cachePath);

// Remove old cached copy if it exists
const cacheExists =
  await ReactNativeBlobUtil.fs.exists(cachePath);

if (cacheExists) {
  await ReactNativeBlobUtil.fs.unlink(cachePath);
}

// Copy generated PDF into cache
await ReactNativeBlobUtil.fs.cp(
  pdfPath,
  cachePath
);

console.log('PDF COPIED TO CACHE');

// ---------------------------------------------------------
// SHARE CACHE FILE
// ---------------------------------------------------------

await Share.open({
  title: 'Legal Metrology Report',
  subject: `Legal Metrology Report - ${productName}`,
  url: `file://${cachePath}`,
  type: 'application/pdf',
  filename: shareFileName,
  failOnCancel: false,
  showAppsToView: true,
});

} catch (error) {

  console.error('PDF generation error:', error);

  Alert.alert(
    'PDF Error',
    error?.message || 'Unable to generate the report PDF.'
  );
}
  };
  // =========================================================
  // RULE ROW
  // =========================================================

  const renderFinding = (item, index) => {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const ruleName =
      item.rule_name ||
      item.field ||
      item.ruleName ||
      item.rule_id ||
      'Rule';

    const status = String(
      item.status || 'UNKNOWN'
    ).toUpperCase();

    const isPass = status === 'PASS';
    const isNotApplicable =
      status === 'NOT_APPLICABLE';
    const isReview = status === 'REVIEW';

    let icon = '✕';
    let iconStyle = styles.failIcon;

    if (isPass) {
      icon = '✓';
      iconStyle = styles.passIcon;
    } else if (isNotApplicable) {
      icon = '—';
      iconStyle = styles.naIcon;
    } else if (isReview) {
      icon = '!';
      iconStyle = styles.reviewIcon;
    }

    return (
      <View
        key={`${ruleName}-${index}`}
        style={styles.findingRow}
      >
        <View
          style={[
            styles.findingIconBox,
            iconStyle,
          ]}
        >
          <Text style={styles.findingIcon}>
            {icon}
          </Text>
        </View>

        <View style={styles.findingContent}>
          <Text style={styles.findingField}>
            {String(ruleName).replace(
              /_/g,
              ' '
            )}
          </Text>

          <Text
            style={[
              styles.findingStatus,
              isPass
                ? styles.passText
                : isNotApplicable
                ? styles.naText
                : isReview
                ? styles.reviewText
                : styles.failText,
            ]}
          >
            {status.replace(/_/g, ' ')}
          </Text>

          {item.message ? (
            <Text style={styles.findingMessage}>
              {String(item.message)}
            </Text>
          ) : null}
        </View>
      </View>
    );
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

        {/* BACK BUTTON */}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>
            ← Back to result
          </Text>
        </TouchableOpacity>

        {/* MAIN REPORT CARD */}

        <View style={styles.reportCard}>

          <Text style={styles.tagline}>
            LEGAL METROLOGY · REPORT
          </Text>

          <Text style={styles.productTitle}>
            {productName}
          </Text>

          <Text style={styles.timestamp}>
            Live Scan · {formattedDate}
          </Text>

          <View style={styles.divider} />

          {/* PRODUCT DETAILS */}

          <Text style={styles.sectionTitle}>
            PRODUCT DETAILS
          </Text>

          <View style={styles.detailsContainer}>

            <DetailRow
              label="Product"
              value={productName}
            />

            <DetailRow
              label="Manufacturer"
              value={manufacturer}
            />

            <DetailRow
              label="Country of Origin"
              value={countryOfOrigin}
            />

            <DetailRow
              label="Manufacture Date"
              value={manufactureDate}
            />

            <DetailRow
              label="Net Quantity"
              value={netQuantity}
            />

            <DetailRow
              label="MRP"
              value={mrp}
              highlight
            />

            <DetailRow
              label="Consumer Care"
              value={consumerPhone}
            />

            {consumerEmail ? (
              <DetailRow
                label="Email"
                value={consumerEmail}
              />
            ) : null}

          </View>

          {/* CAPTURED EVIDENCE */}

          {normalizedImages.length > 0 ? (
            <>
              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                CAPTURED EVIDENCE
              </Text>

              <Text style={styles.evidenceSubtitle}>
                Images analyzed during this inspection
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  styles.imageScroll
                }
              >
                {normalizedImages.map(
                  (uri, index) => (
                    <TouchableOpacity
                      key={`${uri}-${index}`}
                      activeOpacity={0.85}
                      style={styles.imageWrapper}
                      onPress={() =>
                        Alert.alert(
                          'Captured Image',
                          `Evidence image ${
                            index + 1
                          }`
                        )
                      }
                    >
                      <Image
                        source={{ uri: uri }}
                        style={styles.evidenceImage}
                        resizeMode="cover"
                      />

                      <View
                        style={styles.imageNumber}
                      >
                        <Text
                          style={
                            styles.imageNumberText
                          }
                        >
                          {index + 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </>
          ) : null}

          {/* COMPLIANCE STATUS */}

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>
            COMPLIANCE STATUS
          </Text>

          <View
            style={[
              styles.statusCard,
              overallStatus === 'PASS'
                ? styles.statusPass
                : styles.statusFail,
            ]}
          >

            <View
              style={[
                styles.statusCircle,
                overallStatus === 'PASS'
                  ? styles.statusCirclePass
                  : styles.statusCircleFail,
              ]}
            >
              <Text style={styles.statusIcon}>
                {overallStatus === 'PASS'
                  ? '✓'
                  : '✕'}
              </Text>
            </View>

            <View style={styles.statusContent}>

              <Text
                style={[
                  styles.statusTitle,
                  overallStatus === 'PASS'
                    ? styles.passText
                    : styles.failText,
                ]}
              >
                {overallStatus}
              </Text>

              <Text style={styles.statusDescription}>
                {passed} / {applicableRules}{' '}
                applicable requirements satisfied
              </Text>

            </View>
          </View>

          {/* RULE FINDINGS */}

          <Text
            style={[
              styles.sectionTitle,
              { marginTop: 24 },
            ]}
          >
            RULE-BY-RULE FINDINGS
          </Text>

          {findings.length === 0 ? (
            <Text style={styles.noViolations}>
              ✓ All regulatory requirements satisfied.
            </Text>
          ) : (
            <View>
              {findings.map(renderFinding)}
            </View>
          )}

          {/* RULE SET */}

          <View style={styles.ruleSetRow}>

            <Text style={styles.ruleSetLabel}>
              Rule set
            </Text>

            <Text style={styles.ruleSetValue}>
              v2026.09-r1
            </Text>

          </View>

        </View>

        {/* DOWNLOAD PDF */}

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadPDF}
          activeOpacity={0.8}
        >
          <Text style={styles.downloadBtnText}>
            Download PDF
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// =============================================================
// DETAIL ROW
// =============================================================

const DetailRow = ({
  label,
  value,
  highlight,
}) => {
  return (
    <View style={styles.detailRow}>

      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          highlight
            ? styles.detailValueHighlight
            : null,
        ]}
      >
        {String(value || 'Not detected')}
      </Text>

    </View>
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

  // BACK

  backBtn: {
    paddingVertical: 10,
    marginBottom: 12,
  },

  backBtnText: {
    fontSize: 16,
    color: '#101828',
    fontWeight: '600',
  },

  // REPORT CARD

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 20,
  },

  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#667085',
    letterSpacing: 0.8,
  },

  productTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101828',
    marginTop: 5,
  },

  timestamp: {
    fontSize: 12,
    color: '#98A2B3',
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 18,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 20,
  },

  // SECTION

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
    letterSpacing: 0.7,
    marginBottom: 12,
  },

  // DETAILS

  detailsContainer: {
    width: '100%',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    width: '100%',
  },

  detailLabel: {
    width: '36%',
    fontSize: 14,
    color: '#667085',
    lineHeight: 20,
  },

  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    lineHeight: 20,
    textAlign: 'right',
  },

  detailValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },

  // EVIDENCE

  evidenceSubtitle: {
    fontSize: 12,
    color: '#98A2B3',
    marginTop: -5,
    marginBottom: 12,
  },

  imageScroll: {
    paddingRight: 10,
  },

  imageWrapper: {
    width: 125,
    height: 125,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  evidenceImage: {
    width: '100%',
    height: '100%',
  },

  imageNumber: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor:
      'rgba(16, 24, 40, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // STATUS

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },

  statusPass: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },

  statusFail: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },

  statusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  statusCirclePass: {
    backgroundColor: '#12B76A',
  },

  statusCircleFail: {
    backgroundColor: '#D92D20',
  },

  statusIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },

  statusDescription: {
    fontSize: 12,
    color: '#667085',
  },

  // FINDINGS

  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 13,
  },

  findingIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  passIcon: {
    backgroundColor: '#ECFDF3',
  },

  failIcon: {
    backgroundColor: '#FEF3F2',
  },

  reviewIcon: {
    backgroundColor: '#FFFAEB',
  },

  naIcon: {
    backgroundColor: '#F2F4F7',
  },

  findingIcon: {
    fontSize: 13,
    fontWeight: '800',
  },

  findingContent: {
    flex: 1,
  },

  findingField: {
    fontSize: 14,
    color: '#101828',
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 2,
  },

  findingStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },

  findingMessage: {
    fontSize: 12,
    color: '#667085',
    lineHeight: 17,
  },

  passText: {
    color: '#039855',
  },

  failText: {
    color: '#D92D20',
  },

  reviewText: {
    color: '#B54708',
  },

  naText: {
    color: '#667085',
  },

  noViolations: {
    fontSize: 14,
    color: '#039855',
    fontStyle: 'italic',
  },

  // RULE SET

  ruleSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },

  ruleSetLabel: {
    fontSize: 13,
    color: '#667085',
  },

  ruleSetValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101828',
  },

  // DOWNLOAD

  downloadBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  downloadBtnText: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 16,
  },

});

export default ReportViewer;
