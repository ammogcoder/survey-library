<template>
  <div class="sv-vue-row-additional-div">
    <div
      v-for="element in row.visibleElements"
      :key="element.id"
      :style="element.rootStyle"
    >
      <survey-element
        v-if="row.isNeedRender"
        :id="element.id"
        :role="element.ariaRole"
        :aria-required="element.ariaRequired"
        :aria-invalid="element.ariaInvalid"
        :aria-labelledby="element.hasTitle ? element.ariaTitleId : null"
        :data-name="element.name"
        :style="{
          paddingLeft: element.paddingLeft,
          paddingRight: element.paddingRight,
        }"
        :element="element"
        :survey="survey"
        :css="css"
      ></survey-element>
      <component
        v-if="!row.isNeedRender && !!element.skeletonComponentName"
        :is="element.skeletonComponentName"
        :question="element"
        :css="css"
      ></component>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { SurveyModel } from "survey-core";
import { QuestionRowModel } from "survey-core";
import { BaseVue } from "./base";
import { Base } from "survey-core";

@Component
export class Row extends BaseVue {
  @Prop() row: QuestionRowModel;
  @Prop() css: any;
  @Prop() survey: SurveyModel;

  protected getModel(): Base {
    return this.row;
  }
  protected onMounted() {
    if (!!this.row) {
      if (!this.row.isNeedRender) {
        var rowContainerDiv = this.$el;
        setTimeout(() => {
          this.row.startLazyRendering(rowContainerDiv as HTMLElement);
        }, 10);
      }
    }
  }
  beforeDestroy() {
    if (!!this.row) {
      this.row.isNeedRender = !this.row.isLazyRendering();
    }
  }
}
Vue.component("survey-row", Row);
export default Row;
</script>
