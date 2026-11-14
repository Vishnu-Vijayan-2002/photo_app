import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useSession } from '../../context/SessionContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface CreateSessionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ visible, onClose }) => {
  const { theme } = useApp();
  const { createSession } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createSession({
        name: name.trim(),
        description: description.trim(),
      });
      setName('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="New Shooting Session">
      <View style={styles.form}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>SESSION NAME</Text>
        <TextInput
          placeholder="e.g. Wedding - Alex & Jordan, Studio Lookbook"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceActive,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 14 }]}>
          DESCRIPTION (OPTIONAL)
        </Text>
        <TextInput
          placeholder="Notes, location, client details..."
          placeholderTextColor={theme.colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={[
            styles.textArea,
            {
              backgroundColor: theme.colors.surfaceActive,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />

        <View style={styles.btnRow}>
          <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.cancelBtn} />
          <Button
            title="Create Session"
            variant="primary"
            loading={loading}
            disabled={!name.trim()}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    height: 72,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
  },
  cancelBtn: {
    marginRight: 10,
  },
  submitBtn: {
    minWidth: 130,
  },
});
