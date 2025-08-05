import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { googlePlacesService, PlacePrediction } from '../../lib/services/GooglePlacesService';

interface AddressAutocompleteProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (placeId: string) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function AddressAutocomplete({
  label,
  value,
  placeholder,
  onChange,
  onPlaceSelect,
  isFocused = false,
  onFocus,
  onBlur,
}: AddressAutocompleteProps) {
  const { colors } = useTheme();
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length > 2) {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        const results = await googlePlacesService.getPlacePredictions(value);
        setPredictions(results);
        setShowPredictions(results.length > 0);
        setLoading(false);
      }, 500);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    onChange(prediction.description);
    setShowPredictions(false);
    onPlaceSelect?.(prediction.placeId);
  };

  const getInputStyle = () => [
    styles.input,
    {
      backgroundColor: colors.surface,
      color: colors.text,
      borderColor: isFocused ? colors.primary : colors.border,
      borderWidth: isFocused ? 2 : 1,
    },
  ];

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={[styles.predictionItem, { borderBottomColor: colors.border }]}
      onPress={() => handlePlaceSelect(item)}
    >
      <Ionicons name="location" size={16} color={colors.primary} />
      <Text style={[styles.predictionText, { color: colors.text }]} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle()}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => {
            onFocus?.();
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          onBlur={() => {
            onBlur?.();
            // Delay hiding predictions to allow for selection
            setTimeout(() => setShowPredictions(false), 200);
          }}
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      {showPredictions && predictions.length > 0 && (
        <View style={[styles.predictionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.placeId}
            style={styles.predictionsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  predictionsList: {
    borderRadius: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  predictionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
}); 