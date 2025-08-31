import { Colors } from '@/constants/Colors';
import React, { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

type DDItem = { label: string; value: any; disabled?: boolean };

type Props = {
  style?: any;
  placeholder?: string;
  items: DDItem[];
  value: any;
  setValue: any;       // keep passthrough to DropDownPicker
  order?: number;
  /** NEW: decide if an item should be disabled */
  getItemDisabled?: (item: DDItem) => boolean;
};

const ThemedDropdown = ({
  style = null,
  placeholder,
  items = [],
  value,
  setValue,
  order = 0,
  getItemDisabled,
  ...props
}: Props) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState<DDItem[]>(items);

  // ✅ keep local items in sync when parent passes new disabled flags
  useEffect(() => {
    // apply disabled via prop (if provided) so DropDownPicker knows
    if (getItemDisabled) {
      setDropdownItems(items.map(it => ({ ...it, disabled: getItemDisabled(it) })));
    } else {
      setDropdownItems(items);
    }
  }, [items, getItemDisabled]);

  const baseZIndex = 1000;
  const computedZIndex = baseZIndex - order;

  return (
    <View style={[style]}>
      <DropDownPicker
        open={open}
        value={value}
        items={dropdownItems}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setDropdownItems}
        placeholder={placeholder}
        listMode="SCROLLVIEW"
        autoScroll
        zIndex={computedZIndex}
        zIndexInverse={baseZIndex + 1}
        style={{
          backgroundColor: 'white',
          borderColor: theme.text,
          borderWidth: 0,
          borderBottomWidth: 2,
          borderRadius: 0,
          paddingHorizontal: 15,
        }}
        textStyle={{ color: theme.text, fontSize: 14 }}
        placeholderStyle={{ color: theme.placeholder }}
        dropDownContainerStyle={{
          backgroundColor: theme.background,
          borderColor: theme.text,
          borderWidth: 2,
          maxHeight: 200,
        }}
        // 🔒 visually and functionally disable rows
        disabledItemLabelStyle={{ opacity: 0.5 }}
        disabledItemContainerStyle={{ opacity: 0.5 }}
        onSelectItem={(item) => {
          // DropDownPicker normally ignores disabled, but this is belt-and-suspenders
          if ((item as DDItem).disabled) return;
        }}
        {...props}
      />
    </View>
  )
}

export default ThemedDropdown