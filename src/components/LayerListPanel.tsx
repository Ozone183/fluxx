// src/components/LayerListPanel.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { CanvasLayer } from '../types/canvas';

interface LayerListPanelProps {
  visible: boolean;
  layers: CanvasLayer[];
  onClose: () => void;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  selectedLayerId: string | null;
}

const LayerListPanel: React.FC<LayerListPanelProps> = ({
  visible,
  layers,
  onClose,
  onSelectLayer,
  onDeleteLayer,
  selectedLayerId,
}) => {
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Layers ({layers.length})</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {sortedLayers.map((layer, index) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerItem,
                  selectedLayerId === layer.id && styles.layerItemSelected
                ]}
                onPress={() => onSelectLayer(layer.id)}
              >
                <View style={styles.layerInfo}>
                  <Icon
                    name={layer.type === 'image' ? 'image' : 'text'}
                    size={20}
                    color={COLORS.cyan400}
                  />
                  <View style={styles.layerDetails}>
                    <Text style={styles.layerType}>
                      {layer.type === 'image' ? 'Image' : 'Text'} Layer
                    </Text>
                    <Text style={styles.layerUser}>by {layer.createdByUsername}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => onDeleteLayer(layer.id)}>
                  <Icon name="trash-outline" size={20} color={COLORS.red400} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: COLORS.slate800,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  list: {
    padding: 16,
  },
  layerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.slate700,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  layerItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  layerDetails: {
    gap: 4,
  },
  layerType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  layerUser: {
    fontSize: 12,
    color: COLORS.slate400,
  },
});

export default LayerListPanel;
