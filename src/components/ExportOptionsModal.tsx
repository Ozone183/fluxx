// src/components/ExportOptionsModal.tsx

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface ExportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onExportCurrentPage: () => void;
  onExportAllPages: () => void;
  totalPages: number;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  visible,
  onClose,
  onExportCurrentPage,
  onExportAllPages,
  totalPages,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modal}>
          <Text style={styles.title}>Export Options</Text>

          {/* Export Current Page */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onClose();
              onExportCurrentPage();
            }}
          >
            <Ionicons name="image-outline" size={24} color={COLORS.cyan400} />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Export Current Page</Text>
              <Text style={styles.optionSubtitle}>Save as image (PNG)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.slate500} />
          </TouchableOpacity>

          {/* Export All Pages as Video (only if multi-page) */}
          {totalPages > 1 && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onClose();
                onExportAllPages();
              }}
            >
              <Ionicons name="film-outline" size={24} color={COLORS.purple400} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Export All Pages as Video</Text>
                <Text style={styles.optionSubtitle}>
                  {totalPages} pages with transitions (MP4)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.slate500} />
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <TouchableOpacity
            style={[styles.option, styles.cancelOption]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.slate900,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.slate400,
  },
  cancelOption: {
    backgroundColor: COLORS.slate700,
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
});

export default ExportOptionsModal;
