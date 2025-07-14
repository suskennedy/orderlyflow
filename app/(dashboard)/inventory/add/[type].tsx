import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DatePicker from "../../../../components/DatePicker";
import { useInventory } from "../../../../lib/contexts/InventoryContext";
import { useTheme } from "../../../../lib/contexts/ThemeContext";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useDashboard } from "../../../../lib/hooks/useDashboard";
import { supabase } from "../../../../lib/supabase";

// Define common inventory categories
const INVENTORY_CATEGORIES = [
  "Appliances",
  "Filters",
  "Light Fixtures",
  "Paint Colors",
  "Cabinets",
  "Tools",
  "Tiles",
];

interface Home {
  id: string;
  name: string;
}

// Item type configuration
interface ItemTypeConfig {
  title: string;
  table: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  description: string;
}

// Define configuration for each item type
const itemTypeConfigs: Record<string, ItemTypeConfig> = {
  appliance: {
    title: "Add Appliance",
    table: "appliances",
    icon: "cube" as const,
    description: "Track details for refrigerators, washers, dryers, etc.",
  },
  filter: {
    title: "Add Filter",
    table: "filters",
    icon: "filter" as const,
    description: "Track HVAC, water, or other filters in your home",
  },
  light_fixture: {
    title: "Add Light Fixture",
    table: "light_fixtures",
    icon: "bulb" as const,
    description: "Track lamps, ceiling lights, chandeliers, etc.",
  },
  cabinet: {
    title: "Add Cabinet",
    table: "cabinets",
    icon: "file-tray-stacked" as const,
    description: "Track kitchen, bathroom, or storage cabinets",
  },
  tile: {
    title: "Add Tile",
    table: "tiles",
    icon: "grid" as const,
    description: "Track floor, wall, or backsplash tiles",
  },
  paint: {
    title: "Add Paint",
    table: "paint_colors",
    icon: "color-palette" as const,
    description: "Track paint colors used in your home",
  },
};

export default function AddInventoryItemScreen() {
  // Get the item type from the URL parameter
  const { type } = useLocalSearchParams<{ type: string }>();

  const itemType = type || "appliance"; // Default to appliance if no type specified
  const config = itemTypeConfigs[itemType] || itemTypeConfigs.appliance;

  const { user } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const { addItem } = useInventory();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [homes, setHomes] = useState<Home[]>([]);
  const [homesLoading, setHomesLoading] = useState(true);

  // Add these fields to your formData state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
    serial_number: "",
    location: "",
    quantity: "",
    purchase_date: "",
    purchase_cost: "",
    warranty_expiration: "",
    home_id: "",
    notes: "",
    // Type-specific fields
    color: "", // Used by paint, tiles, and cabinets
    size: "", // Used by tiles and filters
    material: "", // Used by cabinets and tiles
    filter_type: "", // For filters
    bulb_type: "", // For light fixtures
    wattage: "", // For light fixtures
    style: "", // For cabinets and light fixtures
    room: "", // For cabinets, tiles, paint, and light fixtures
    replacement_frequency: "", // For filter replacements (maps to replacement_frequency)
    manual_url: "", // For appliances
    last_replaced: "", // Add this for filters
  });

  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    }
  }, [user?.id]);

  const fetchHomes = async () => {
    try {
      setHomesLoading(true);

      if (!user?.id) {
        console.log("No user ID available");
        return;
      }

      const { data, error } = await supabase
        .from("homes")
        .select("id, name")
        .eq("user_id", user?.id)
        .order("name");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      setHomes(data || []);
    } catch (error) {
      console.error("Error fetching homes:", error);
      Alert.alert("Error", "Failed to load homes. Please try again.");
    } finally {
      setHomesLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", `Please enter a ${itemType} name`);
      return;
    }

    setLoading(true);
    try {
      // Create base data that all items share
      const baseItemData = {
        name: formData.name,
        brand: formData.brand || null,
        // Don't include model for filters
        model: formData.model,
        // Don't include serial_number for filters
        ...(itemType !== "filter"
          ? { serial_number: formData.serial_number || null }
          : {}),
        location: formData.location || null,
        // Don't include purchase_date for filters
        ...(itemType !== "filter" ? { purchase_date: formData.purchase_date || null } : {}),
        // Don't include warranty_expiration for filters
        ...(itemType !== "filter" ? { warranty_expiration: formData.warranty_expiration || null } : {}),
        home_id: formData.home_id || null,
        notes: formData.notes || null,
      };

      // Add type-specific fields based on item type
      let additionalFields = {};

      switch (itemType) {
        case "paint":
          additionalFields = {
            // Remove 'finish' field as it's not in the schema
            // Use color_code instead of color to match the schema
            color_code: formData.color || null,
            color_hex: null, // Not collecting this yet, but in schema
            room: formData.room || null,
            // Use date_purchased instead of purchase_date to match schema
          };
          break;
        case "tile":
          // Create a new item data object that strictly follows the schema
          // Instead of using baseItemData which contains fields not in the schema
          additionalFields = {
            name: formData.name,
            brand: formData.brand || null,
            home_id: formData.home_id || null,
            material: formData.material || null,
            color: formData.color || null,
            size: formData.size || null,
            room: formData.room || null,
            purchase_date: formData.purchase_date || null,
            notes: formData.notes || null,
          };
          break;
        case "filter":
          additionalFields = {
            size: formData.size || null,
            type: formData.filter_type || null, // Note: database uses 'type' not 'filter_type'
            brand: formData.brand || null,
            replacement_frequency: formData.replacement_frequency
              ? Number(formData.replacement_frequency)
              : null,
            last_replaced: formData.last_replaced || null, // Use this instead of purchase_date
            // Remove warranty_expiration and purchase_date as they don't exist in filters table
          };
          break;
        case "light_fixture":
          additionalFields = {
            bulb_type: formData.bulb_type || null,
            wattage: formData.wattage || null,
            type: formData.style || null, // Map style input to type field in database
            model: formData.model || null, // These were missing in your additionalFields
            serial_number: formData.serial_number || null,
            purchase_date: formData.purchase_date || null,
            warranty_expiration: formData.warranty_expiration || null,
          };
          break;
        case "cabinet":
          additionalFields = {
            material: formData.material || null,
            color: formData.color || null,
            style: formData.style || null,
            room: formData.room || null,
            model: formData.model || null,            // Add missing model field
            warranty_expiration: formData.warranty_expiration || null  // Add missing warranty field
          };
          break;
        case "appliance":
          additionalFields = {
            manual_url: formData.manual_url || null,
          };
          break;
      }

      // Create item data to insert into database
      const itemData = {
        ...baseItemData,
        ...additionalFields,
      };

      // Create item for immediate UI display with item_type
      // const newItem = {
      //   ...itemData,
      //   item_type: itemType as
      //     | "appliance"
      //     | "paint"
      //     | "tile"
      //     | "filter"
      //     | "light_fixture"
      //     | "cabinet",
      //   homes: formData.home_id
      //     ? homes.find((h) => h.id === formData.home_id)
      //     : null,
      // };

      // Add to local state for immediate display
      // addItem(newItem); // REMOVE THIS

      // Then save to database
      if (itemType === "paint") {
        // For paints, create a direct itemData object with only the fields in the schema
        const itemData = {
          name: formData.name,
          brand: formData.brand || null,
          color_code: formData.color || null,  // Map color to color_code
          color_hex: null,                     // Not collecting this yet
          room: formData.room || null,
          date_purchased: formData.purchase_date || null, // Map purchase_date to date_purchased
          home_id: formData.home_id || null,
          notes: formData.notes || null,
        };

        // Create UI item
        const newItem = {
          ...itemData,
          item_type: "paint",
          homes: formData.home_id ? homes.find((h) => h.id === formData.home_id) : null,
        };

        // Add to UI state
        addItem(newItem);

        // Save to database - use the schema-compliant object directly
        const { error } = await supabase.from("paint_colors").insert([itemData]);
        
        if (error) throw error;
      } else if (itemType === "tile") {
        // For tiles, create a direct itemData object with only the fields in the schema
        // (instead of using the baseItemData + additionalFields approach)
        const itemData = {
          name: formData.name,
          brand: formData.brand || null,
          material: formData.material || null,
          color: formData.color || null,
          size: formData.size || null,
          room: formData.room || null,
          purchase_date: formData.purchase_date || null,
          home_id: formData.home_id || null,
          notes: formData.notes || null,
        };

        // Create UI item
        const newItem = {
          ...itemData,
          item_type: "tile",
          homes: formData.home_id ? homes.find((h) => h.id === formData.home_id) : null,
        };

        // Add to UI state
        addItem(newItem);

        // Save to database - use the schema-compliant object directly
        const { error } = await supabase.from("tiles").insert([itemData]);
        
        if (error) throw error;
      } else {
        // Handle all other item types as before
        const itemData = {
          ...baseItemData,
          ...additionalFields,
        };
        
        const newItem = {
          ...itemData,
          item_type: itemType,
          homes: formData.home_id ? homes.find((h) => h.id === formData.home_id) : null,
        };
        
        addItem(newItem);
        const { error } = await supabase.from(config.table as any).insert([itemData]);
        
        if (error) throw error;
      }

      // Refresh dashboard stats
      await fetchDashboardStats();

      // Go back without waiting for alert
      router.back();
    } catch (error) {
      console.error(`Error adding ${itemType}:`, error);
      Alert.alert("Error", `Failed to add ${itemType}`);
    } finally {
      setLoading(false);
    }
  };

  // Render type-specific fields based on item type
  const renderTypeSpecificFields = () => {
    switch (itemType) {
      case "paint":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Color Code</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., SW-7036, BM-2124-40"
                value={formData.color}
                onChangeText={(text) =>
                  setFormData({ ...formData, color: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Living Room, Bedroom, Bathroom"
                value={formData.room}
                onChangeText={(text) =>
                  setFormData({ ...formData, room: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </>
        );

      // In the renderTypeSpecificFields function - update the filter case
      case "filter":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Filter Type</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., HVAC, Water, Air Purifier"
                value={formData.filter_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, filter_type: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Size</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., 16x20x1, 10-inch"
                value={formData.size}
                onChangeText={(text) =>
                  setFormData({ ...formData, size: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Replacement Frequency (months)</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., 3, 6, 12"
                value={formData.replacement_frequency}
                onChangeText={(text) =>
                  setFormData({ ...formData, replacement_frequency: text })
                }
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <DatePicker
                label="Last Replaced"
                value={formData.last_replaced}
                placeholder="Select last replacement date"
                onChange={(date) =>
                  setFormData({ ...formData, last_replaced: date as string })
                }
                isOptional={true}
                testID="last-replaced-date-picker"
              />
            </View>
          </>
        );

      case "light_fixture":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bulb Type</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., LED, Incandescent, Fluorescent"
                value={formData.bulb_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, bulb_type: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Wattage</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., 60W, 9W"
                value={formData.wattage}
                onChangeText={(text) =>
                  setFormData({ ...formData, wattage: text })
                }
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Style</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Modern, Traditional, Industrial"
                value={formData.style}
                onChangeText={(text) =>
                  setFormData({ ...formData, style: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Living Room, Kitchen, Bathroom"
                value={formData.room}
                onChangeText={(text) =>
                  setFormData({ ...formData, room: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </>
        );

      case "tile":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., White, Black, Gray"
                value={formData.color}
                onChangeText={(text) =>
                  setFormData({ ...formData, color: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Size</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., 12x12, 6x24"
                value={formData.size}
                onChangeText={(text) =>
                  setFormData({ ...formData, size: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Material</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Ceramic, Porcelain, Marble"
                value={formData.material}
                onChangeText={(text) =>
                  setFormData({ ...formData, material: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Bathroom, Kitchen, Entry"
                value={formData.room}
                onChangeText={(text) =>
                  setFormData({ ...formData, room: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </>
        );

      case "cabinet":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Material</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Wood, MDF, Laminate"
                value={formData.material}
                onChangeText={(text) =>
                  setFormData({ ...formData, material: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., White, Cherry, Oak"
                value={formData.color}
                onChangeText={(text) =>
                  setFormData({ ...formData, color: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Style</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Shaker, Modern, Traditional"
                value={formData.style}
                onChangeText={(text) =>
                  setFormData({ ...formData, style: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Kitchen, Bathroom, Laundry"
                value={formData.room}
                onChangeText={(text) =>
                  setFormData({ ...formData, room: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </>
        );

      case "appliance":
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Manual URL</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="e.g., https://example.com/manual.pdf"
              value={formData.manual_url}
              onChangeText={(text) =>
                setFormData({ ...formData, manual_url: text })
              }
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        );

      default:
        return null;
    }
  };

  // Update these visibility flags in your component:
  const showModelFields = itemType !== "tile" && itemType !== "filter" && itemType !== "paint";
  const showSerialNumberField = itemType !== "tile" && itemType !== "filter" && itemType !== "paint";
  const showWarrantyField = itemType !== "tile" && itemType !== "filter" && itemType !== "paint";
  const showLocationField = itemType !== "tile" && itemType !== "paint"; // Hide location for paint as well

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.itemTypeDisplay, { backgroundColor: colors.surfaceVariant }]}>
          <View style={[styles.itemTypeIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name={config.icon} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.itemTypeDescription, { color: colors.textSecondary }]}>{config.description}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Information</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Item Name *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder={`Enter ${itemType} name`}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }]}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) =>
                  setFormData({ ...formData, category: itemValue })
                }
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Select a category..." value="" color={colors.textTertiary} />
                {INVENTORY_CATEGORIES.map((category) => (
                  <Picker.Item
                    key={category}
                    label={category}
                    value={category}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Brand</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="Samsung, Filtrete, etc."
                value={formData.brand}
                onChangeText={(text) =>
                  setFormData({ ...formData, brand: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            {showModelFields && (
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Model</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    color: colors.text
                  }]}
                  placeholder="Model number"
                  value={formData.model}
                  onChangeText={(text) =>
                    setFormData({ ...formData, model: text })
                  }
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}
          </View>

          {showSerialNumberField && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Serial Number</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="Serial number"
                value={formData.serial_number}
                onChangeText={(text) =>
                  setFormData({ ...formData, serial_number: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          )}

          {/* Render type-specific fields */}
          {renderTypeSpecificFields()}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location & Assignment</Text>
          {showLocationField && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="e.g., Kitchen, Basement, Garage"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Assign to Home</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }]}>
              <Picker
                selectedValue={formData.home_id}
                onValueChange={(itemValue) =>
                  setFormData({ ...formData, home_id: itemValue })
                }
                style={[styles.picker, { color: colors.text }]}
                enabled={!homesLoading}
              >
                <Picker.Item
                  label={
                    homesLoading
                      ? "Loading homes..."
                      : homes.length === 0
                      ? "No homes found - Add a home first"
                      : "Select a home..."
                  }
                  value=""
                  color={colors.textTertiary}
                />
                {homes.map((home) => (
                  <Picker.Item
                    key={home.id}
                    label={home.name}
                    value={home.id}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
            {homes.length === 0 && !homesLoading && (
              <TouchableOpacity
                style={[styles.addHomeButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => router.push("/homes/add")}
              >
                <Text style={[styles.addHomeButtonText, { color: colors.primary }]}>Add a Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Purchase Information</Text>

          <View style={styles.inputGroup}>
            <DatePicker
              label={itemType === "paint" ? "Date Purchased" : "Purchase Date"}
              value={formData.purchase_date}
              placeholder={itemType === "paint" ? "Select date purchased" : "Select purchase date"}
              onChange={(date) =>
                setFormData({ ...formData, purchase_date: date as string })
              }
              isOptional={true}
              testID="purchase-date-picker"
            />
          </View>
          
          {showWarrantyField && (
            <View style={styles.inputGroup}>
              <DatePicker
                label="Warranty Expiration"
                value={formData.warranty_expiration}
                placeholder="Select warranty expiration date"
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    warranty_expiration: date as string,
                  })
                }
                isOptional={true}
                testID="warranty-date-picker"
              />
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="Add any additional notes about this item"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  saveButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemTypeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  itemTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemTypeDescription: {
    fontSize: 14,
    flex: 1,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addHomeButton: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  addHomeButtonText: {
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 100,
  },
});
