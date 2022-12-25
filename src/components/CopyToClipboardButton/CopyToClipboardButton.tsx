import styles from "../../pages/Call/Call.module.scss";
import React, {useEffect, useRef, useState} from "react";
import {ChainIcon, WhiteTickIcon} from '../../assets';
import CopyToClipboard from 'react-copy-to-clipboard';

interface IProps {
  text: string
}

export const CopyToClipboardButton = ({text}:IProps) => {
  const timer = useRef<NodeJS.Timeout>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
    }
  }, [])

  function onCopy() {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <CopyToClipboard
      onCopy={onCopy}
      text={text}
    >
      <button className={styles.inviteButton}>
        <img
          src={copied ? WhiteTickIcon : ChainIcon}
          alt={'copy icon'}
        />
        {copied ? 'Copied!' : 'Copy invite link'}
      </button>
    </CopyToClipboard>
  )
}
