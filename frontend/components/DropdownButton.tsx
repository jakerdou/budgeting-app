import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, Dimensions } from 'react-native';

type DropdownButtonProps = {
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  modalPosition?: 'above' | 'below';
};

const DropdownButton: React.FC<DropdownButtonProps> = ({ options, selectedOption, onSelect, modalPosition = 'below' }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleOptionSelect = (option: string) => {
    onSelect(option);
    setModalVisible(false);
  };

  const handleButtonLayout = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        ref={buttonRef}
        onLayout={handleButtonLayout}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? '#d3d3d3' : '#f0f0f0' }
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>{selectedOption || 'Select an Option'}</Text>
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalContent,
              {
                top: modalPosition === 'above' ? buttonLayout.y - buttonLayout.height : buttonLayout.y + buttonLayout.height,
                left: buttonLayout.x,
                width: buttonLayout.width,
              }
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionButton,
                      { opacity: pressed ? 0.5 : 1 }
                    ]}
                    onPress={() => handleOptionSelect(item)}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </Pressable>
                  <View style={styles.separator} />
                </View>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Add your styles here
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    // Add your styles here
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionText: {
    // Add your styles here
  },
  separator: {
    height: 1,
    backgroundColor: '#d3d3d3',
    marginVertical: 5,
  },
});

export default DropdownButton;
