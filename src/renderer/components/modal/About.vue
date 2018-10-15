<template>
  <div id="about">
    <div class="drag"></div>
    <div class="close" @click="close()">&times;</div>
    <div class="header">
      <img src="static/icons/icon.png" width="128" height="128">
      <div>CodeChecker v{{ version }}</div>
    </div>
    <div class="credits">
      <ul>
        <li>Développement : Matthieu YK</li>
        <li>Icône : <span @click="openLink('https://fontawesome.com/')" class="cursor">FontAwesome</span> / <span @click="openLink('https://game-icons.net/')" class="cursor">Game-Icons</span></li>
        <li>Moteur : <span @click="openLink('https://vuejs.org/')" class="cursor">VueJS</span> / <span @click="openLink('https://electronjs.org')" class="cursor">ElectronJS</span></li>
      </ul>
    </div>
  </div>
</template>

<script>
  import { shell, remote } from 'electron'

  export default {
    data () {
      return {
        version: remote.app.getVersion(),
      }
    },
    methods: {
      /**
       * Close the about modal
       */
      close () {
        remote.getCurrentWindow().close()
      },
      openLink (url) {
        shell.openExternal(url)
      },
    },
    mounted () {
      console.log('[VUE] Mount About.vue')
    },
  }
</script>

<style lang="scss">
  @import "../../assets/scss/vars";

  #about {
    color: $logoColor;
    .header {
      text-align: center;
      font-size: 1.5em;
      -webkit-text-stroke: 1px $logoStroke;
      img {
        -webkit-app-region: drag;
      }
    }
    .close {
      position: absolute;
      z-index: 5;
      top: 0;
      right: 0;
      padding: 0 3px;
      font-size: 1.5em;
      cursor: pointer;
    }
    .drag {
      position: absolute;
      top: 0;
      left: 0;
      height: 15px;
      width: calc(100% - 20px);
      -webkit-app-region: drag;
    }
    .credits {
      position: absolute;
      bottom: 0;
      ul {
        list-style: none;
        -webkit-margin-before: 0;
        -webkit-padding-start: 15px;
      }
    }
  }
  .cursor {
    cursor: pointer;
  }
</style>
