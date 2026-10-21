# Neural Lab

Browser-local learning experiment at `/lab/neural`. No remote model or training service.

## Engine

`engine/network.js` implements dense layers, seeded uniform initialization, tanh/ReLU/sigmoid hidden activations, sigmoid output, stable logit-space binary cross-entropy, analytic backpropagation, and full-batch gradient descent. Supported shapes: two inputs, zero to two hidden layers of up to eight neurons, one output. Biases start at zero. Initialization uses Xavier uniform, or He uniform for ReLU hidden layers.

`gradients()` returns a mean batch gradient without changing weights. `train()` applies full-batch updates and counts epochs. `applySample()` applies the captured gradient in the teaching trace and counts single-sample updates separately. Numerical gradients are tested against central differences for all hidden activation functions through two hidden layers.

## Experiments and rendering

XOR uses four labeled corners, all for training; it is a representation demonstration, not a generalization score. Circles and spirals use deterministic balanced 80/20 train/held-out splits. User-added points join training. Editing retains weights, pauses training, and restarts measured history. Architecture/activation/seed changes reset weights. Up to 160 points are allowed to keep the interaction bounded.

The field evaluates a 65×65 probability grid; marching squares interpolates the 0.5 boundary. Neuron tiles evaluate the same input plane with 20×20 samples. Selected-probe values and connection widths/colors come from current activations and weights. ReLU tile colors use a/(1+a), tanh uses (a+1)/2, and output tiles show sigmoid probabilities directly.

Training runs in bounded animation-frame batches with a 10 Hz publication cadence. Hidden tabs stop consuming training time. A training-speed setting is a target, not a throughput guarantee. The loss chart retains 400 observations. Its vertical axis is logarithmic and clips below 1e-4 or above 10 for display; numeric metrics retain the actual values.

The teaching trace snapshots one training point, its forward pass, its analytic gradient, and weights before update. Its last stage applies that captured gradient once. The dataset's held-out points are excluded from epoch training and from the trace selector.

## Verification

Engine tests cover gradient checks, XOR versus a linear model, deterministic training, single-sample descent, extreme logits, and data splits. UI tests cover trace progression/reset, architecture changes, held-out metrics, and keyboard point editing. Browser checks include live learning, activation selection, and viewport widths 320, 390, 768, and 1440 px.

## Spiral training preset and optimizers

Selecting the spiral experiment now loads its verified starting configuration: two hidden layers of eight tanh neurons, seed 42, Adam, and learning rate 0.01. A visible reload button restores both that setup and the original spiral data. The generator and 80/20 split were not simplified to make the result easier.

Adam is implemented explicitly with first/second moments, beta1=0.9, beta2=0.999, epsilon=1e-8, and timestep bias correction. Moment state survives animation-frame batch boundaries. Changing the optimizer, resetting the network, or applying a manual trace update clears optimizer memory. Plain gradient descent remains available. The single-sample teaching trace deliberately continues to demonstrate a plain gradient-descent update and labels that distinction.

For the original seed-42 dataset at 1,000 epochs, the preset obtains training BCE ≈0.00329 and held-out BCE ≈0.04056, with all 80 training and 20 held-out points classified correctly. This is a regression fixture, not a guarantee for edited data or every seed. The former XOR starter (one four-neuron tanh layer, gradient descent at 0.08) remains near 65% training accuracy after 10,000 epochs on the same spiral. Tests also verify Adam's bias correction and moment persistence across split training calls.

## Workspace views

Data & model holds dataset editing and model configuration. Training shows only transport controls, the decision field, and measured loss. Network shows the weight diagram, probe calculation, and activation maps for one selected layer. Gradient trace has a separate training-sample and neuron selector. The parent retains the network, Adam moments, dataset edits, history, probe, selection, and captured trace across view changes; switching views pauses training. Only the active view's canvases are mounted. Focus workspace contains keyboard focus, restores body scrolling on exit/unmount, and exits with Escape. The separate writeup route remains available outside focus mode.

The setup and training views share the same canvas column width and square aspect ratio. The trace walkthrough keeps the sample label visible, explains prediction/loss/gradient/update in separate steps, and stores a post-update snapshot for the measured before/after comparison. Equations and connection selection are optional details. Only Apply changes weights; the first three stages inspect the captured state.
