import React from 'react'
import {Logo} from '../../assets'
import styles from './Header.module.scss'
import {observer} from 'mobx-react'
import classNames from 'classnames'
import {Flex} from '@chakra-ui/react';
import {useBreakpoints} from '../../hooks/useBreakpoints';

export const Header = observer(({children, centered, title}) => {
  const {isMobile} = useBreakpoints()

  return <div className={classNames(styles.container, centered && styles.containerCentered)}>
    <Flex
      flexGrow={1}
      width={!isMobile ? '25%' : 'initial'}
      justifyContent={centered ? 'center' : 'initial'}
    >
      <div className={styles.logoContainer}>
        <img
          src={Logo}
          alt={'dTelecom logo'}
        />
      </div>
    </Flex>

    {!isMobile && (
      <Flex
        flexGrow={1}
        alignItems={'center'}
        justifyContent={'center'}
        width={'50%'}
      >
        {title && (
          <h1 className={styles.title}>
            {title}
          </h1>
        )}
      </Flex>
    )}


    {(!isMobile || (isMobile && children)) && (
      <Flex
        flexGrow={1}
        width={'25%'}
      >
        {children && (
          <div className={styles.controlContainer}>
            {children}
          </div>
        )}
      </Flex>
    )}
  </div>
})