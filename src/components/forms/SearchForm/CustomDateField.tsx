/**
 * CustomDateField Component
 *
 * A custom date picker field with chevron navigation buttons.
 * Displays date in "Thu, Feb 5" format with left/right chevrons to change date by 1 day.
 */

import { useState } from "react";
import { Box, InputAdornment, IconButton } from "@mui/material";
import { CalendarMonth, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addDays, subDays } from "date-fns";

export interface CustomDateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  onBlur?: () => void;
  minDate: Date;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export function CustomDateField({
  label,
  value,
  onChange,
  onBlur,
  minDate,
  disabled,
  required,
  error,
  helperText,
}: CustomDateFieldProps) {
  const [open, setOpen] = useState(false);

  const handlePrevDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (value) {
      const newDate = subDays(value, 1);
      // Only allow if new date is not before minDate
      if (newDate >= minDate) {
        onChange(newDate);
      }
    } else {
      // If no date selected, set to minDate
      onChange(minDate);
    }
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (value) {
      onChange(addDays(value, 1));
    } else {
      // If no date selected, set to minDate
      onChange(minDate);
    }
  };

  const canGoPrev = value ? subDays(value, 1) >= minDate : false;

  return (
    <Box
      sx={{
        display: "flex",
        position: "relative",
        alignItems: "flex-start",
        gap: 0,
        width: "100%",
      }}
    >
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        minDate={minDate}
        disabled={disabled}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        format="EEE, MMM d"
        slots={{
          openPickerIcon: () => null, // Hide default calendar icon
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            required,
            error,
            helperText,
            onBlur,
            onClick: () => !disabled && setOpen(true),
            InputProps: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth color="action" />
                </InputAdornment>
              ),
              sx: {
                cursor: "pointer",
                pr: 0.5,
              },
            },
            inputProps: {
              style: { cursor: "pointer" },
            },
            sx: {
              position: "relative",
              "& .MuiFormHelperText-root": {
                position: "absolute",
                bottom: -20,
                left: 0,
                margin: 0,
              },
              "& .MuiInputBase-root": {
                cursor: "pointer",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderRight: "none",
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            },
          },
          popper: {
            placement: "bottom-start",
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: 0,
          display: "flex",
          alignItems: "center",
          height: 56,
          px: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={handlePrevDay}
          disabled={disabled || !canGoPrev}
          sx={{ p: 0.5 }}
          aria-label="Previous day"
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleNextDay}
          disabled={disabled}
          sx={{ p: 0.5 }}
          aria-label="Next day"
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default CustomDateField;
