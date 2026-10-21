import TagsDropDownMenu from "./TagsDropDownMenu";

export default function TagPill({ tag }) {
  return (
    <TagsDropDownMenu tag={tag}>
      <span className="bg-card text-ink flex items-center gap-1 rounded-full border border-dashed border-[#C7CBF2] px-3.5 py-2 font-sans text-[13.5px] font-bold">
        <span className="text-accent">#</span>
        {tag.name}
      </span>
    </TagsDropDownMenu>
  );
}
