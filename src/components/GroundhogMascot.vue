<script setup lang="ts"></script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    aria-labelledby="groundhog-title"
  >
    <title id="groundhog-title">Friendly Groundhog Mascot</title>
    <g>
      <!-- Body -->
      <path
        d="M 50,30 C 25,30 25,70 50,70 C 75,70 75,30 50,30 Z"
        fill="#A0522D"
      />
      <!-- Head -->
      <circle
        cx="50"
        cy="45"
        r="20"
        fill="#D2691E"
      />
      <!-- Ears -->
      <circle
        cx="35"
        cy="30"
        r="5"
        fill="#A0522D"
      />
      <circle
        cx="65"
        cy="30"
        r="5"
        fill="#A0522D"
      />
      <!-- Eyes -->
      <circle
        cx="42"
        cy="42"
        r="3"
        fill="#000000"
      />
      <circle
        cx="58"
        cy="42"
        r="3"
        fill="#000000"
      />
      <!-- Nose -->
      <polygon
        points="50,48 52,52 48,52"
        fill="#000000"
      />
      <!-- Teeth -->
      <rect
        x="48"
        y="52"
        width="4"
        height="5"
        fill="#FFFFFF"
      />
    </g>
  </svg>
</template>

<style scoped>
svg {
  display: block;
  margin: auto;
  max-width: 150px;
}
</style>
