import React from 'react'
import {CheckboxOffIcon, CheckboxOnIcon} from "../../assets"
import {Box, Checkbox} from "@chakra-ui/react"
import styles from './CustomCheckbox.module.scss'

interface IProps {
  label: string
  checked: boolean
  setChecked: (checked: boolean) => void
}

export const CustomCheckbox = ({label, checked, setChecked}: IProps) => {
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  const CustomIcon = () => {
    let src = checked ? CheckboxOnIcon : CheckboxOffIcon
    let alt = checked ? 'Checkbox On' : 'Checkbox Off'

    return <Box
      w={24}
      h={24}
      ml={8}
    >
      <img
        src={src}
        alt={alt}
      />
    </Box>
  }

  return (
    <Checkbox
      onChange={handleCheckboxChange}
      icon={<CustomIcon/>}
      spacing={0}
      className={styles.checkbox}
    >
      {label}
    </Checkbox>
  )
}
