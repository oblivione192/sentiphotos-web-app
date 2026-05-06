interface CreateReflectionButtonProps {
  label?: string
  onClick?: () => void
}

function CreateReflectionButton({
  label = 'Create New Reflection',
  onClick,
}: CreateReflectionButtonProps) {
  return (
    <section className="cta-area section-entrance delay-4">
      <button className="create-reflection-button" type="button" onClick={onClick}>
        {label}
      </button>
    </section>
  )
}

export default CreateReflectionButton
