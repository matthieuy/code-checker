<template>
  <div id="splashscreen">
    <img src="static/icons/icon.png" />
    <div class="title">CodeChecker</div>
    <div class="loading">Chargement en cours</div>
  </div>
</template>

<script>
  export default {
    mounted () {
      console.log('[VUE] Mount SplashScreen.vue')
    },
  }
</script>

<style lang="scss">
  @import "../../assets/scss/vars";

  #splashscreen {
    cursor: progress;
    img {
      display: block;
      width: 128px;
      margin: 25px auto 15px auto;
    }
    .title {
      text-align: center;
      font-size: 2em;
      color: $logoColor;
      -webkit-text-stroke: 1px $logoStroke;
    }
    .loading {
      color: $logoStroke;
      margin-left: 40px;
      &:after {
        overflow: hidden;
        display: inline-block;
        vertical-align: bottom;
        -webkit-animation: ellipsis steps(4,end) 1500ms infinite;
        content: "\2026";
        width: 0;
      }
    }
  }

  @keyframes ellipsis {
    to {
      width: 20px;
    }
  }

  @-webkit-keyframes ellipsis {
    to {
      width: 20px;
    }
  }
</style>
