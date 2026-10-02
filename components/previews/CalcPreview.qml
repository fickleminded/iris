import QtQuick
import qs.Commons
import qs.Ui

Item {
  id: root

  property var item: null
  property string fontFamily: Style.font.menuFamily
  property color foreground: Color.menu.text
  property color accent: Color.accent
  property color border: Color.menu.border
  property int cornerRadius: Style.cornerRadius

  property bool copied: false

  signal copyRequested()

  Timer {
    id: copyResetTimer
    interval: 1400
    repeat: false
    onTriggered: root.copied = false
  }

  function triggerCopy() {
    root.copied = true
    copyResetTimer.restart()
    root.copyRequested()
  }

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.spacing.md

    // Header section: Icon, Category title, and Status badge
    Row {
      width: parent.width
      spacing: Style.spacing.md

      Item {
        width: Style.space(48)
        height: Style.space(48)
        anchors.verticalCenter: parent.verticalCenter

        Rectangle {
          anchors.fill: parent
          radius: Style.space(12)
          color: Util.alpha(root.accent, 0.16)

          Text {
            anchors.centerIn: parent
            text: root.item && root.item.icon ? root.item.icon : "󰪚"
            font.family: root.fontFamily
            font.pixelSize: Style.space(24)
            color: root.accent
          }
        }
      }

      Column {
        width: parent.width - Style.space(48) - parent.spacing
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(2)

        Row {
          width: parent.width
          spacing: Style.spacing.sm

          Text {
            text: root.item && root.item.category ? root.item.category.toUpperCase() : "CALCULATOR"
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
            color: root.accent
            elide: Text.ElideRight
          }

          Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: hitLabel.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(3)
            color: Util.alpha(root.accent, 0.18)

            Text {
              id: hitLabel
              anchors.centerIn: parent
              text: "INSTANT RESULT"
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Math.max(8, Style.font.caption - 2)
              font.bold: true
              color: root.accent
            }
          }
        }

        Text {
          width: parent.width
          text: root.item && root.item.expression ? root.item.expression : ""
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: root.foreground
          opacity: 0.65
          elide: Text.ElideRight
        }
      }
    }

    // Divider
    Rectangle {
      width: parent.width
      height: 1
      color: root.border
      opacity: 0.4
    }

    // Hero Result Card
    Rectangle {
      width: parent.width
      height: Math.max(Style.space(88), heroColumn.implicitHeight + Style.spacing.md * 2)
      radius: root.cornerRadius
      color: Util.alpha(root.accent, 0.08)
      border.color: Util.alpha(root.accent, 0.28)
      border.width: 1

      Column {
        id: heroColumn
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(4)

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: root.item && root.item.expression ? (root.item.expression + " =") : ""
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          color: root.foreground
          opacity: 0.6
          elide: Text.ElideRight
          maximumLineCount: 1
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          width: parent.width
          text: root.item && root.item.name ? root.item.name : ""
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.space(30)
          font.bold: true
          color: root.accent
          horizontalAlignment: Text.AlignHCenter
          elide: Text.ElideRight
          maximumLineCount: 1
        }
      }
    }

    // Detail breakdown card
    Rectangle {
      width: parent.width
      height: Math.max(Style.space(72), detailsColumn.implicitHeight + Style.spacing.sm * 2)
      radius: root.cornerRadius
      color: Util.alpha(root.foreground, 0.04)
      border.color: root.border
      border.width: 1

      Column {
        id: detailsColumn
        anchors.fill: parent
        anchors.margins: Style.spacing.sm
        spacing: Style.space(6)

        // Mathematical detail rows
        Column {
          visible: Boolean(root.item && root.item.details && !root.item.details.isConversion)
          width: parent.width
          spacing: Style.space(4)

          Row {
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Raw Value"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? (root.item.details.raw || "") : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              font.bold: true
              color: root.foreground
              elide: Text.ElideRight
            }
          }

          Row {
            visible: Boolean(root.item && root.item.details && root.item.details.hex)
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Hexadecimal"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? (root.item.details.hex || "") : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.accent
              elide: Text.ElideRight
            }
          }

          Row {
            visible: Boolean(root.item && root.item.details && root.item.details.binary)
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Binary"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? (root.item.details.binary || "") : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.85
              elide: Text.ElideRight
            }
          }

          Row {
            visible: Boolean(root.item && root.item.details && root.item.details.scientific)
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Scientific"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? (root.item.details.scientific || "") : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.85
              elide: Text.ElideRight
            }
          }
        }

        // Unit conversion detail rows
        Column {
          visible: Boolean(root.item && root.item.details && root.item.details.isConversion === true)
          width: parent.width
          spacing: Style.space(4)

          Row {
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Original"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? (root.item.details.fromFormatted + " " + (root.item.details.fromName || root.item.details.fromUnit)) : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              elide: Text.ElideRight
            }
          }

          Row {
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Converted"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? (root.item.details.toFormatted + " " + (root.item.details.toName || root.item.details.toUnit)) : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              font.bold: true
              color: root.accent
              elide: Text.ElideRight
            }
          }

          Row {
            visible: Boolean(root.item && root.item.details && root.item.details.rateText && root.item.details.rateText.length > 0)
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Factor"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: root.item && root.item.details ? root.item.details.rateText : ""
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.75
              elide: Text.ElideRight
            }
          }

          Row {
            visible: Boolean(root.item && root.item.details && root.item.details.isCurrency === true)
            width: parent.width
            spacing: Style.spacing.sm
            Text {
              width: Style.space(100)
              text: "Notice"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.55
            }
            Text {
              width: parent.width - Style.space(100) - parent.spacing
              text: "Offline reference exchange rate"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              color: root.foreground
              opacity: 0.5
              elide: Text.ElideRight
            }
          }
        }
      }
    }

    Item {
      width: 1
      height: Style.space(6)
    }

    // Prominent Copy Button
    Rectangle {
      id: copyBtn
      width: parent.width
      height: Style.space(38)
      radius: root.cornerRadius
      color: root.copied
        ? Util.alpha(root.accent, 0.9)
        : (copyMouseArea.containsMouse ? root.accent : Util.alpha(root.accent, 0.2))

      Behavior on color {
        ColorAnimation { duration: 120 }
      }

      Row {
        anchors.centerIn: parent
        spacing: Style.spacing.sm

        Text {
          text: root.copied ? "󰄬" : "󰅍"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: (root.copied || copyMouseArea.containsMouse) ? Color.menu.selectedText : root.accent
        }

        Text {
          text: root.copied ? "Copied to Clipboard!" : "Press Enter to Copy Result"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          font.bold: true
          color: (root.copied || copyMouseArea.containsMouse) ? Color.menu.selectedText : root.accent
        }
      }

      MouseArea {
        id: copyMouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.triggerCopy()
      }
    }
  }
}
